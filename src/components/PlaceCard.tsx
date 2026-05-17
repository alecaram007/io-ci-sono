import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvatarStack } from './AvatarStack';
import { PlaceImage } from './PlaceImage';
import { buildPlaceMedia } from '../services/placeMedia';
import { colors, fonts, tints } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  place: PlaceWithPresence;
  onPress: () => void;
};

const heatCopy = {
  quiet: 'tranquillo',
  warming: 'si scalda',
  hot: 'caldo',
  wild: 'pieno vivo',
};

export function PlaceCard({ place, onPress }: Props) {
  const heatLabel = heatCopy[place.heatLevel];
  const presenceSummary = place.isUserHere
    ? `Sei qui, ${place.totalCount} persone in totale`
    : `${place.totalCount} persone presenti`;
  const accessibilityLabel = `${place.name} a ${place.city}. ${presenceSummary}. Stato: ${heatLabel}.`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Apre i dettagli del luogo"
    >
      <View style={[styles.signal, { backgroundColor: place.heroColor }]} />
      <View style={styles.imageWrap}>
        <PlaceImage media={buildPlaceMedia(place)} label="foto del posto" height={138} />
      </View>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.category}>{place.category} / {place.city}</Text>
          <Text style={styles.name}>{place.name}</Text>
        </View>
        <View style={[styles.countBadge, place.isUserHere && styles.countBadgeActive]}>
          <Text style={styles.count}>{place.totalCount}</Text>
          <Text style={styles.countLabel}>ci sono</Text>
        </View>
      </View>
      <Text style={styles.description}>{place.description}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.heat, place.heatLevel === 'wild' && styles.heatWild]}>{heatLabel}</Text>
        <Text style={styles.location}>{place.province} / {place.region}</Text>
      </View>
      <View style={styles.bottomRow}>
        <AvatarStack avatars={place.visibleAvatars} total={place.friendCount} />
        {place.isUserHere ? <Text style={styles.here}>sei qui</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tints.panel(0.94),
    borderColor: tints.fog(0.08),
    borderRadius: 26,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    padding: 18,
  },
  signal: {
    height: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  imageWrap: {
    justifyContent: 'flex-end',
    marginBottom: 16,
    marginTop: 6,
  },
  titleBlock: {
    flex: 1,
  },
  category: {
    color: colors.muted,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 31,
    letterSpacing: -0.6,
    lineHeight: 34,
    marginTop: 3,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: 20,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  countBadgeActive: {
    backgroundColor: colors.acid,
  },
  count: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 26,
  },
  countLabel: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: -1,
  },
  description: {
    color: '#C2BAA9',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heat: {
    backgroundColor: tints.gold(0.14),
    borderRadius: 999,
    color: colors.acid,
    fontFamily: fonts.body,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heatWild: {
    backgroundColor: tints.copper(0.22),
    color: colors.flame,
  },
  location: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    paddingVertical: 5,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  here: {
    color: colors.acid,
    fontFamily: fonts.display,
    fontSize: 16,
    textTransform: 'uppercase',
  },
});
