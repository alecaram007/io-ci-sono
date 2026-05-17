import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, tints } from '../theme';

type Props = {
  title?: string;
  copy?: string;
};

export function EmptyState({
  title = 'Nessun posto trovato',
  copy = 'Allarga i filtri oppure aggiungi un nuovo luogo dalla console admin.',
}: Props) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    backgroundColor: tints.panel(0.88),
    borderRadius: 28,
    padding: 22,
  },
  emptyTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  emptyCopy: {
    color: colors.muted,
    fontFamily: fonts.body,
    marginTop: 6,
    textAlign: 'center',
  },
});
