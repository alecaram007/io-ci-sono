import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tints } from '../theme';
import type { PlaceWithPresence } from '../types';

type Props = {
  totalTonight: number;
  hottest?: PlaceWithPresence;
  label: string;
};

export function HeroStats({ totalTonight, hottest, label }: Props) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroStripe} />
      <Text style={styles.heroKicker}>{label}</Text>
      <Text style={styles.heroNumber} accessibilityLabel={`${totalTonight} persone stasera`}>{totalTonight}</Text>
      <Text style={styles.heroCopy}>persone hanno gia scelto dove saranno stasera</Text>
      <View style={styles.hotLine}>
        <Text style={styles.hotLabel}>Piu caldo ora</Text>
        <Text style={styles.hotName}>{hottest?.name ?? 'Nessun luogo'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: tints.fog(0.96),
    borderRadius: 34,
    overflow: 'hidden',
    padding: 22,
  },
  heroStripe: {
    backgroundColor: colors.acid,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 6,
  },
  heroKicker: {
    color: '#6A5E4A',
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroNumber: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 76,
    letterSpacing: -2.6,
    lineHeight: 76,
    marginTop: 2,
  },
  heroCopy: {
    color: '#4A4438',
    fontFamily: fonts.body,
    fontSize: 15,
    maxWidth: 250,
  },
  hotLine: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    padding: 12,
  },
  hotLabel: {
    color: colors.acid,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  hotName: {
    color: colors.fog,
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
