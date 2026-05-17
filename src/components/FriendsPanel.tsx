import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AvatarStack } from './AvatarStack';
import { colors, fonts, tints } from '../theme';
import type { Friendship, Profile } from '../types';
import { getAcceptedFriendIds } from '../domain/privacy';

type Props = {
  currentUser: Profile;
  profiles: Profile[];
  friendships: Friendship[];
  onAcceptRequest: (friendshipId: string) => void;
};

export function FriendsPanel({ currentUser, profiles, friendships, onAcceptRequest }: Props) {
  const friendIds = getAcceptedFriendIds(friendships, currentUser.id);
  const friends = profiles.filter((profile) => friendIds.includes(profile.id));
  const pending = friendships.filter((friendship) => friendship.status === 'pending' && friendship.addresseeId === currentUser.id);

  return (
    <View style={styles.wrap}>
      <View style={styles.inviteCard}>
        <View style={styles.qrBox}>
          <QRCode value={`iocisono://friend/${currentUser.friendCode}`} size={108} color={colors.ink} backgroundColor={colors.sand} />
        </View>
        <View style={styles.inviteCopy}>
          <Text style={styles.kicker}>Codice amico</Text>
          <Text style={styles.code}>{currentUser.friendCode}</Text>
          <Text style={styles.small}>Condividi QR o nickname. Niente rubrica obbligatoria.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amici</Text>
        <AvatarStack avatars={friends} total={friends.length} />
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendRow}>
            <View style={[styles.dot, { backgroundColor: friend.avatarColor }]} />
            <View>
              <Text style={styles.friendName}>{friend.displayName}</Text>
              <Text style={styles.friendNick}>@{friend.nickname}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Richieste</Text>
        {pending.length === 0 ? <Text style={styles.small}>Nessuna richiesta in attesa.</Text> : null}
        {pending.map((request) => {
          const requester = profiles.find((profile) => profile.id === request.requesterId);
          return (
            <View key={request.id} style={styles.requestRow}>
              <Text style={styles.friendName}>{requester?.displayName ?? 'Nuovo utente'}</Text>
              <TouchableOpacity onPress={() => onAcceptRequest(request.id)} style={styles.acceptButton}>
                <Text style={styles.acceptText}>Accetta</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingBottom: 30,
  },
  inviteCard: {
    backgroundColor: colors.acid,
    borderRadius: 30,
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  qrBox: {
    backgroundColor: colors.sand,
    borderRadius: 22,
    padding: 10,
  },
  inviteCopy: {
    flex: 1,
    justifyContent: 'center',
  },
  kicker: {
    color: '#5A4A1F',
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  code: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 35,
    lineHeight: 37,
  },
  small: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    backgroundColor: tints.panel(0.94),
    borderRadius: 28,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: colors.fog,
    fontFamily: fonts.display,
    fontSize: 28,
  },
  friendRow: {
    alignItems: 'center',
    borderTopColor: tints.fog(0.06),
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  dot: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
  friendName: {
    color: colors.fog,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  friendNick: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  requestRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    backgroundColor: colors.acid,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acceptText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 12,
  },
});
