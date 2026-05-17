import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  active: boolean;
  onPress: () => void;
};

export function PresenceButton({ active, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[styles.button, active && styles.active]}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Sei gia in questo luogo stasera' : 'Dichiara che ci sarai stasera'}
    >
      <Text style={styles.label}>{active ? 'Ci sei qui stasera' : 'Io ci sono!'}</Text>
      <Text style={styles.hint}>{active ? 'La tua presenza e gia conteggiata' : 'Sposta qui la tua presenza della serata'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.acid,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  active: {
    backgroundColor: colors.mint,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
  },
  hint: {
    color: '#3A2E1A',
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
});
