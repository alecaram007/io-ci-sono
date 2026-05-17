import { StyleSheet, Text, View } from 'react-native';
import type { VisibleAvatar } from '../types';
import { colors, fonts } from '../theme';

type Props = {
  avatars: VisibleAvatar[];
  total?: number;
};

export function AvatarStack({ avatars, total = avatars.length }: Props) {
  if (!avatars.length) {
    return <Text style={styles.empty}>Nessun amico visibile qui</Text>;
  }

  const summary = total === 1 ? '1 amico qui' : `${total} amici qui`;
  const names = avatars.map((avatar) => avatar.displayName).join(', ');

  return (
    <View style={styles.row} accessibilityRole="summary" accessibilityLabel={`${summary}: ${names}`}>
      {avatars.map((avatar, index) => (
        <View
          key={avatar.id}
          style={[
            styles.avatar,
            { backgroundColor: avatar.avatarColor, marginLeft: index === 0 ? 0 : -10 },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={styles.initial}>{avatar.displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
      ))}
      <Text style={styles.copy}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  avatar: {
    alignItems: 'center',
    borderColor: colors.ink,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  initial: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 17,
  },
  copy: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  empty: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
