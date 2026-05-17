import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tints } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  places: PlaceWithPresence[];
  onSelect: (place: PlaceWithPresence) => void;
};

export function HotMap({ places, onSelect }: Props) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackTitle}>Mappa mobile</Text>
      <Text style={styles.fallbackCopy}>Su iOS/Android vedrai marker caldi e luoghi vicini. Sul web resta una preview cliccabile.</Text>
      {places.slice(0, 4).map((place) => (
        <Text key={place.id} onPress={() => onSelect(place)} style={styles.row}>
          {place.totalCount} / {place.name} / {place.city}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.panel,
    borderRadius: 30,
    gap: 10,
    marginBottom: 18,
    padding: 24,
  },
  fallbackTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 30,
  },
  fallbackCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
  row: {
    backgroundColor: tints.fog(0.06),
    borderRadius: 16,
    color: colors.fog,
    fontFamily: fonts.body,
    overflow: 'hidden',
    padding: 12,
  },
});
