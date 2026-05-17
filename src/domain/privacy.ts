import type { Block, Friendship, NightlyPresence, Profile, VisibleAvatar } from '../types';

export function isBlockedBetween(blocks: Block[], firstUserId: string, secondUserId: string) {
  return blocks.some(
    (block) =>
      (block.blockerId === firstUserId && block.blockedId === secondUserId) ||
      (block.blockerId === secondUserId && block.blockedId === firstUserId),
  );
}

export function getAcceptedFriendIds(friendships: Friendship[], userId: string) {
  return friendships
    .filter((friendship) => friendship.status === 'accepted')
    .flatMap((friendship) => {
      if (friendship.requesterId === userId) return [friendship.addresseeId];
      if (friendship.addresseeId === userId) return [friendship.requesterId];
      return [];
    });
}

export function getVisibleFriendAvatars(input: {
  viewerId: string;
  placeId: string;
  nightKey: string;
  profiles: Profile[];
  friendships: Friendship[];
  presences: NightlyPresence[];
  blocks: Block[];
  limit?: number;
}): VisibleAvatar[] {
  const { viewerId, placeId, nightKey, profiles, friendships, presences, blocks, limit = 5 } = input;
  const friendIds = new Set(getAcceptedFriendIds(friendships, viewerId));
  const presentFriendIds = presences
    .filter((presence) => presence.placeId === placeId && presence.nightKey === nightKey)
    .map((presence) => presence.userId)
    .filter((userId) => friendIds.has(userId))
    .filter((userId) => !isBlockedBetween(blocks, viewerId, userId));

  return profiles
    .filter((profile) => presentFriendIds.includes(profile.id))
    .slice(0, limit)
    .map(({ id, nickname, displayName, avatarColor, avatarUrl }) => ({
      id,
      nickname,
      displayName,
      avatarColor,
      avatarUrl,
    }));
}
