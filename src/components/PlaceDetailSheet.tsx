import { Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { AvatarStack } from './AvatarStack';
import { PlaceImage } from './PlaceImage';
import { PresenceButton } from './PresenceButton';
import { buildPlaceMedia } from '../services/placeMedia';
import { colors, fonts, tints } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  place: PlaceWithPresence | null;
  visible: boolean;
  onClose: () => void;
  onSetPresence: (placeId: string) => void;
};

const HEAT_COPY: Record<PlaceWithPresence['heatLevel'], string> = {
  quiet: 'tranquillo',
  warming: 'si scalda',
  hot: 'caldo',
  wild: 'pieno vivo',
};

function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.max(50, Math.round(km * 1000 / 10) * 10);
    return `${meters} m da te`;
  }
  if (km < 10) return `${km.toFixed(1)} km da te`;
  return `${Math.round(km)} km da te`;
}

function walkingTimeLabel(km: number): string {
  const minutes = Math.max(2, Math.round(km * 12));
  if (minutes < 60) return `${minutes} min a piedi`;
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  return r === 0 ? `${h}h a piedi` : `${h}h ${r}m a piedi`;
}

function buildMapsUrl(latitude: number, longitude: number, label: string): string {
  const encoded = encodeURIComponent(label);
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encoded}`;
  }
  // Android / Web → Google Maps via geo: con fallback web
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encoded}`;
}

export function PlaceDetailSheet({ place, visible, onClose, onSetPresence }: Props) {
  if (!place) return null;

  const sharePlace = async () => {
    const message = `Stasera ${place.name} (${place.city}, ${place.province}) sembra ${HEAT_COPY[place.heatLevel]} su Io ci sono.`;
    try {
      await Share.share({ message });
    } catch {
      // Share UI non disponibile su alcuni ambienti.
    }
  };

  const openInMaps = async () => {
    const url = buildMapsUrl(place.latitude, place.longitude, place.name);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      // mappe non disponibili (es. simulator senza app installata)
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.dismissArea}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Chiudi dettaglio luogo"
        />
        <View style={styles.sheet}>
          <View style={[styles.heroLine, { backgroundColor: place.heroColor }]} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.handle}
              accessibilityRole="button"
              accessibilityLabel="Chiudi"
            />
            <Text style={styles.category}>{place.category} · {place.city} · {place.province}</Text>
            <Text style={styles.title}>{place.name}</Text>
            {place.distanceKm !== undefined ? (
              <Text style={styles.distanceLine}>📍 {formatDistance(place.distanceKm)} · {walkingTimeLabel(place.distanceKm)}</Text>
            ) : null}

            <View style={styles.photo}>
              <PlaceImage media={buildPlaceMedia(place)} label="luogo" height={210} showCredit />
            </View>

            {/* SEZIONE 1 · CHI C'È */}
            <Text style={styles.sectionLabel}>Chi c'è stasera</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{place.totalCount}</Text>
                <Text style={styles.statLabel}>persone</Text>
              </View>
              <View style={styles.statBoxDark}>
                <Text style={styles.statNumberLight}>{place.friendCount}</Text>
                <Text style={styles.statLabelLight}>amici qui</Text>
              </View>
              <View style={styles.statBoxDark}>
                <Text style={[styles.statNumberLight, styles.heatNumber]}>{HEAT_COPY[place.heatLevel]}</Text>
                <Text style={styles.statLabelLight}>vibe</Text>
              </View>
            </View>
            {place.visibleAvatars.length > 0 ? (
              <View style={styles.friendsBlock}>
                <AvatarStack avatars={place.visibleAvatars} total={place.friendCount} />
              </View>
            ) : null}

            {/* SEZIONE 2 · DOVE */}
            <Text style={styles.sectionLabel}>Dove</Text>
            <Text style={styles.description}>{place.description}</Text>
            {place.factoid ? (
              <View style={styles.factoidBox}>
                <Text style={styles.factoidKicker}>Pillola</Text>
                <Text style={styles.factoidText}>{place.factoid}</Text>
              </View>
            ) : null}

            {/* SEZIONE 3 · VIBE */}
            {place.vibeTags.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Vibe</Text>
                <View style={styles.tags}>
                  {place.vibeTags.map((tag) => (
                    <Text key={tag} style={styles.tag}>{tag}</Text>
                  ))}
                </View>
              </>
            ) : null}

            {/* SEZIONE 4 · PRIVACY */}
            <View style={styles.privacyBox}>
              <Text style={styles.privacyTitle}>Privacy promessa</Text>
              <Text style={styles.privacyCopy}>
                Il conteggio totale è pubblico. Vedi solo amici accettati e non bloccati. Chi è in modalità invisibile conta nel totale ma non appare qui.
              </Text>
            </View>

            <PresenceButton active={place.isUserHere} onPress={() => onSetPresence(place.id)} />

            <Pressable onPress={openInMaps} style={styles.ghostButton} accessibilityRole="button" accessibilityLabel="Apri in Mappe">
              <Text style={styles.ghostButtonText}>Apri in Mappe</Text>
            </Pressable>
            <Pressable onPress={sharePlace} style={styles.ghostButton} accessibilityRole="button" accessibilityLabel={`Condividi ${place.name}`}>
              <Text style={styles.ghostButtonText}>Condividi luogo</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Chiudi dettaglio">
              <Text style={styles.closeText}>Chiudi</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.ink,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    maxHeight: '88%',
    overflow: 'hidden',
    padding: 22,
  },
  heroLine: {
    height: 7,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: tints.fog(0.28),
    borderRadius: 999,
    height: 5,
    marginBottom: 18,
    width: 48,
  },
  category: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 38,
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: 6,
  },
  distanceLine: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 8,
  },
  photo: {
    marginTop: 14,
  },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  description: {
    color: '#C2BAA9',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    backgroundColor: colors.acid,
    borderRadius: 22,
    flex: 1,
    padding: 14,
  },
  statBoxDark: {
    backgroundColor: colors.panel,
    borderColor: tints.fog(0.10),
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  statNumber: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
  },
  statNumberLight: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
  },
  heatNumber: {
    fontSize: 18,
    lineHeight: 22,
  },
  statLabel: {
    color: '#3A2E1A',
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statLabelLight: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  friendsBlock: {
    marginTop: 12,
  },
  factoidBox: {
    backgroundColor: tints.gold(0.08),
    borderColor: tints.gold(0.32),
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  factoidKicker: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  factoidText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    fontStyle: 'italic',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: tints.fog(0.08),
    borderRadius: 999,
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  privacyBox: {
    backgroundColor: tints.fog(0.05),
    borderColor: tints.fog(0.08),
    borderWidth: 1,
    borderRadius: 22,
    gap: 8,
    marginVertical: 18,
    padding: 14,
  },
  privacyTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  privacyCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  ghostButton: {
    alignItems: 'center',
    backgroundColor: tints.fog(0.06),
    borderColor: tints.fog(0.12),
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 13,
  },
  ghostButtonText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  closeText: {
    color: colors.muted,
    fontFamily: fonts.body,
  },
});
