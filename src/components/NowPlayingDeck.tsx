import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PlaceImage } from './PlaceImage';
import { buildPlaceMedia } from '../services/placeMedia';
import { colors, fonts, tints } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  places: PlaceWithPresence[];
  totalTonight: number;
  tonightLabel: string;
  onSetPresence: (placeId: string) => void;
  onOpenDetail: (placeId: string) => void;
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
  // velocità media camminata 5 km/h → 12 minuti per km
  const minutes = Math.max(2, Math.round(km * 12));
  if (minutes < 60) return `${minutes} min a piedi`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours}h a piedi` : `${hours}h ${rem}m a piedi`;
}

function friendCopy(avatars: PlaceWithPresence['visibleAvatars']): string {
  const names = avatars.map((a) => a.displayName.split(/\s+/)[0]).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} ci sta`;
  if (names.length === 2) return `${names[0]} e ${names[1]} ci sono`;
  if (names.length === 3) return `${names[0]}, ${names[1]} e ${names[2]} ci sono`;
  const head = names.slice(0, 2).join(', ');
  return `${head} e altri ${names.length - 2} amici`;
}

export function NowPlayingDeck({ places, totalTonight, tonightLabel, onSetPresence, onOpenDetail }: Props) {
  const userPlaceIndex = places.findIndex((place) => place.isUserHere);
  const initialIndex = userPlaceIndex >= 0 ? userPlaceIndex : 0;
  const [focusIndex, setFocusIndex] = useState(initialIndex);

  useEffect(() => {
    if (userPlaceIndex >= 0) {
      setFocusIndex(userPlaceIndex);
    }
  }, [userPlaceIndex]);

  useEffect(() => {
    if (focusIndex >= places.length && places.length > 0) {
      setFocusIndex(0);
    }
  }, [focusIndex, places.length]);

  if (places.length === 0) {
    return null;
  }

  const safeIndex = Math.min(focusIndex, places.length - 1);
  const focused = places[safeIndex];
  // Limita la coda ai primi 12 (oltre, montare TouchableOpacity per centinaia
  // di luoghi rallenta scroll e re-render su dataset grandi).
  const queue = places.filter((place) => place.id !== focused.id).slice(0, 12);
  const queueRemainder = Math.max(0, places.length - 1 - queue.length);

  const skipPrev = () => {
    void Haptics.selectionAsync();
    setFocusIndex((current) => (current - 1 + places.length) % places.length);
  };

  const skipNext = () => {
    void Haptics.selectionAsync();
    setFocusIndex((current) => (current + 1) % places.length);
  };

  const focusFromQueue = (placeId: string) => {
    const idx = places.findIndex((place) => place.id === placeId);
    if (idx >= 0) {
      void Haptics.selectionAsync();
      setFocusIndex(idx);
    }
  };

  const progressPct = totalTonight > 0
    ? Math.max(4, Math.min(100, Math.round((focused.totalCount / totalTonight) * 100)))
    : 4;

  const nowLabel = focused.isUserHere ? 'IO SONO QUI' : 'STASERA IN ONDA';
  const ctaLabel = focused.isUserHere ? 'Ci sei qui stasera' : 'Io ci sono!';

  return (
    <View style={styles.deck}>
      <View style={styles.topBar}>
        <Text style={styles.eyebrow} numberOfLines={1}>{tonightLabel}</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>IN ONDA</Text>
        </View>
      </View>

      <Text style={styles.preStrip}>{totalTonight} PERSONE STASERA</Text>

      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onOpenDetail(focused.id)}
        accessibilityRole="button"
        accessibilityLabel={`Apri dettaglio ${focused.name}`}
        style={styles.artworkWrap}
      >
        <View style={styles.artworkFrame}>
          <PlaceImage media={buildPlaceMedia(focused)} label="luogo" height={220} />
          <View style={styles.artworkBadge}>
            <View style={[styles.artworkDot, { backgroundColor: focused.heroColor }]} />
          </View>
          <View style={styles.artworkNumWrap} pointerEvents="none">
            <Text style={styles.artworkNum}>{focused.totalCount}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Text style={styles.nowLabel}>{nowLabel}</Text>
      <Text style={styles.placeName} numberOfLines={2}>{focused.name}</Text>
      <Text style={styles.placeSub} numberOfLines={1}>
        {focused.category} · {focused.city} · {focused.province}
      </Text>

      {focused.distanceKm !== undefined ? (
        <Text style={styles.distanceLine} numberOfLines={1}>
          📍 {formatDistance(focused.distanceKm)} · {walkingTimeLabel(focused.distanceKm)}
        </Text>
      ) : null}

      {focused.visibleAvatars.length > 0 ? (
        <View style={styles.friendsRow}>
          <View style={styles.friendsStack}>
            {focused.visibleAvatars.slice(0, 4).map((avatar, index) => (
              <View
                key={avatar.id}
                style={[
                  styles.friendDot,
                  { backgroundColor: avatar.avatarColor, marginLeft: index === 0 ? 0 : -8 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.friendsText} numberOfLines={1}>
            {friendCopy(focused.visibleAvatars)}
          </Text>
        </View>
      ) : null}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressMetaText}>{focused.totalCount} persone stasera</Text>
        <Text style={[styles.progressMetaText, styles.progressMetaTextHot]}>{HEAT_COPY[focused.heatLevel]}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={skipPrev}
          style={styles.ctrl}
          accessibilityRole="button"
          accessibilityLabel="Posto precedente"
        >
          <Text style={styles.ctrlLabel}>↶  Passo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSetPresence(focused.id)}
          style={[styles.ctrl, styles.ctrlPrimary, focused.isUserHere && styles.ctrlPrimaryActive]}
          accessibilityRole="button"
          accessibilityLabel={focused.isUserHere ? `Sei già a ${focused.name}` : `Dichiara presenza a ${focused.name}`}
        >
          <Text style={styles.ctrlPrimaryLabel}>{ctaLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={skipNext}
          style={styles.ctrl}
          accessibilityRole="button"
          accessibilityLabel="Posto successivo"
        >
          <Text style={styles.ctrlLabel}>Sposto  ↷</Text>
        </TouchableOpacity>
      </View>

      {queue.length > 0 ? (
        <View style={styles.queue}>
          <View style={styles.queueHead}>
            <Text style={styles.queueLabel}>↓ Prossimi in coda</Text>
            <Text style={styles.queueMore}>
              {queueRemainder > 0 ? `${queue.length} di ${queue.length + queueRemainder + 1} POSTI` : `${queue.length} POSTI`}
            </Text>
          </View>
          {queue.map((place) => (
            <TouchableOpacity
              key={place.id}
              onPress={() => focusFromQueue(place.id)}
              onLongPress={() => onOpenDetail(place.id)}
              style={styles.queueRow}
              accessibilityRole="button"
              accessibilityLabel={`Sposta in player ${place.name}`}
              accessibilityHint="Tieni premuto per dettaglio"
            >
              <View style={[styles.queueMini, { backgroundColor: place.heroColor }]} />
              <View style={styles.queueInfo}>
                <Text style={styles.queueName} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.queueSub} numberOfLines={1}>
                  {place.city.toUpperCase()} · {HEAT_COPY[place.heatLevel]}
                </Text>
              </View>
              <View style={styles.queueCountWrap}>
                <Text style={styles.queueCount}>{place.totalCount}</Text>
                <Text style={styles.queueCountSub}>CI SONO</Text>
              </View>
            </TouchableOpacity>
          ))}
          {queueRemainder > 0 ? (
            <Text style={styles.queueRemainder}>+{queueRemainder} altri luoghi · affina la ricerca per vederli</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    backgroundColor: tints.panel(0.6),
    borderRadius: 28,
    padding: 18,
    borderColor: tints.fog(0.06),
    borderWidth: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomColor: tints.fog(0.06),
    borderBottomWidth: 1,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.flame,
  },
  liveText: {
    color: colors.flame,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  preStrip: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 18,
  },
  artworkWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  artworkFrame: {
    width: 220,
    height: 220,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: tints.fog(0.06),
  },
  artworkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tints.ink(0.75),
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  artworkNumWrap: {
    position: 'absolute',
    bottom: 14,
    left: 16,
  },
  artworkNum: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.8,
  },
  nowLabel: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 22,
  },
  placeName: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginTop: 8,
  },
  placeSub: {
    color: '#C2BAA9',
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  distanceLine: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 10,
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: tints.fog(0.05),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tints.fog(0.08),
  },
  friendsStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.panel,
  },
  friendsText: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: tints.fog(0.08),
    borderRadius: 999,
    marginTop: 22,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.acid,
    borderRadius: 999,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressMetaText: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  progressMetaTextHot: {
    color: colors.acid,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  ctrl: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: tints.fog(0.08),
    borderColor: tints.fog(0.08),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlPrimary: {
    flex: 2,
    backgroundColor: colors.acid,
    borderColor: colors.acid,
    paddingVertical: 15,
  },
  ctrlPrimaryActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  ctrlLabel: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  ctrlPrimaryLabel: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  queue: {
    marginTop: 22,
    paddingTop: 16,
    borderTopColor: tints.fog(0.06),
    borderTopWidth: 1,
  },
  queueHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueLabel: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  queueMore: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomColor: tints.fog(0.04),
    borderBottomWidth: 1,
  },
  queueMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  queueInfo: {
    flex: 1,
  },
  queueName: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  queueSub: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  queueCountWrap: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  queueCount: {
    color: colors.acid,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 22,
  },
  queueCountSub: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  queueRemainder: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 10,
  },
});
