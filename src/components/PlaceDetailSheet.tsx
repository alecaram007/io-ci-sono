import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
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

export function PlaceDetailSheet({ place, visible, onClose, onSetPresence }: Props) {
  if (!place) return null;

  const sharePlace = async () => {
    const message = `Stasera ${place.name} (${place.city}, ${place.province}) sembra caldo su Io ci sono.`;
    try {
      await Share.share({ message });
    } catch {
      // Share UI non disponibile su alcuni ambienti.
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
            <View style={styles.handle} />
            <Text style={styles.category}>{place.category} / {place.city}</Text>
            <Text style={styles.title}>{place.name}</Text>
            <View style={styles.photo}>
              <PlaceImage media={buildPlaceMedia(place)} label="luogo" height={210} showCredit />
            </View>
            <Text style={styles.description}>{place.description}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{place.totalCount}</Text>
                <Text style={styles.statLabel}>persone stasera</Text>
              </View>
              <View style={styles.statBoxDark}>
                <Text style={styles.statNumberLight}>{place.friendCount}</Text>
                <Text style={styles.statLabelLight}>amici visibili</Text>
              </View>
            </View>
            <View style={styles.tags}>{place.vibeTags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>
            <View style={styles.privacyBox}>
              <Text style={styles.privacyTitle}>Privacy promessa</Text>
              <Text style={styles.privacyCopy}>Il conteggio totale e pubblico. Gli avatar qui sotto sono solo amici accettati e non bloccati.</Text>
              <AvatarStack avatars={place.visibleAvatars} total={place.friendCount} />
            </View>
            <PresenceButton active={place.isUserHere} onPress={() => onSetPresence(place.id)} />
            <Pressable onPress={sharePlace} style={styles.shareButton} accessibilityRole="button" accessibilityLabel={`Condividi ${place.name}`}>
              <Text style={styles.shareText}>Condividi luogo</Text>
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
    maxHeight: '84%',
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
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 43,
    letterSpacing: -1,
    lineHeight: 45,
    marginTop: 4,
  },
  description: {
    color: '#C2BAA9',
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  photo: {
    marginTop: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  statBox: {
    backgroundColor: colors.acid,
    borderRadius: 24,
    flex: 1,
    padding: 16,
  },
  statBoxDark: {
    backgroundColor: colors.panel,
    borderColor: tints.fog(0.10),
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  statNumber: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 38,
  },
  statNumberLight: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 38,
  },
  statLabel: {
    color: '#3A2E1A',
    fontFamily: fonts.body,
    fontSize: 12,
  },
  statLabelLight: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
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
    backgroundColor: tints.fog(0.06),
    borderRadius: 24,
    gap: 8,
    marginVertical: 18,
    padding: 16,
  },
  privacyTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 21,
  },
  privacyCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: tints.fog(0.08),
    borderColor: tints.fog(0.18),
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 13,
  },
  shareText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  closeText: {
    color: colors.muted,
    fontFamily: fonts.body,
  },
});
