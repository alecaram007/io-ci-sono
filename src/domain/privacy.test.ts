import { describe, expect, it } from 'vitest';
import type { Block, Friendship, NightlyPresence, Profile } from '../types';
import { getVisibleFriendAvatars } from './privacy';

const profiles: Profile[] = [
  { id: 'viewer', nickname: 'viewer', displayName: 'Viewer', avatarColor: '#fff', ageConfirmed: true, role: 'user', friendCode: 'V' },
  { id: 'friend', nickname: 'friend', displayName: 'Friend', avatarColor: '#111', ageConfirmed: true, role: 'user', friendCode: 'F' },
  { id: 'stranger', nickname: 'stranger', displayName: 'Stranger', avatarColor: '#222', ageConfirmed: true, role: 'user', friendCode: 'S' },
  { id: 'blocked', nickname: 'blocked', displayName: 'Blocked', avatarColor: '#333', ageConfirmed: true, role: 'user', friendCode: 'B' },
];

const friendships: Friendship[] = [
  { id: 'f1', requesterId: 'viewer', addresseeId: 'friend', status: 'accepted', createdAt: 'now' },
  { id: 'f2', requesterId: 'viewer', addresseeId: 'blocked', status: 'accepted', createdAt: 'now' },
];

const presences: NightlyPresence[] = [
  { id: 'p1', userId: 'friend', placeId: 'place', nightKey: 'night', createdAt: 'now', updatedAt: 'now' },
  { id: 'p2', userId: 'stranger', placeId: 'place', nightKey: 'night', createdAt: 'now', updatedAt: 'now' },
  { id: 'p3', userId: 'blocked', placeId: 'place', nightKey: 'night', createdAt: 'now', updatedAt: 'now' },
];

const blocks: Block[] = [{ id: 'b1', blockerId: 'viewer', blockedId: 'blocked', createdAt: 'now' }];

describe('presence privacy', () => {
  it('shows only accepted friends and excludes blocked users', () => {
    const visible = getVisibleFriendAvatars({ viewerId: 'viewer', placeId: 'place', nightKey: 'night', profiles, friendships, presences, blocks });
    expect(visible.map((avatar) => avatar.id)).toEqual(['friend']);
  });
});
