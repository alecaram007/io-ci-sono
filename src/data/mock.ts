import { sicilyPlaces } from './sicilyPlaces';
import type { Block, Friendship, NightlyPresence, Place, Profile, Report } from '../types';

export const currentUser: Profile = {
  id: 'user-alex',
  nickname: 'ale-night',
  displayName: 'Alessandro',
  avatarColor: '#ff7a1a',
  ageConfirmed: true,
  role: 'admin',
  friendCode: 'ALE-7421',
};

export const profiles: Profile[] = [
  currentUser,
  { id: 'user-sofia', nickname: 'sofiaride', displayName: 'Sofia', avatarColor: '#f3d35b', ageConfirmed: true, role: 'user', friendCode: 'SOF-2110' },
  { id: 'user-nico', nickname: 'nico.wave', displayName: 'Nico', avatarColor: '#61d095', ageConfirmed: true, role: 'user', friendCode: 'NIC-9002' },
  { id: 'user-marta', nickname: 'marta.fm', displayName: 'Marta', avatarColor: '#81a8ff', ageConfirmed: true, role: 'user', friendCode: 'MAR-1188' },
  { id: 'user-luca', nickname: 'lucarush', displayName: 'Luca', avatarColor: '#f26d8f', ageConfirmed: true, role: 'user', friendCode: 'LUC-4200' },
  { id: 'user-giulia', nickname: 'giu.rooftop', displayName: 'Giulia', avatarColor: '#c2ff45', ageConfirmed: true, role: 'user', friendCode: 'GIU-6501' },
  { id: 'user-random-1', nickname: 'metroline', displayName: 'Metroline', avatarColor: '#9b8cff', ageConfirmed: true, role: 'user', friendCode: 'MET-3319' },
];

export const friendships: Friendship[] = [
  { id: 'friend-1', requesterId: 'user-alex', addresseeId: 'user-sofia', status: 'accepted', createdAt: '2026-05-05T18:00:00.000Z' },
  { id: 'friend-2', requesterId: 'user-nico', addresseeId: 'user-alex', status: 'accepted', createdAt: '2026-05-06T18:00:00.000Z' },
  { id: 'friend-3', requesterId: 'user-marta', addresseeId: 'user-alex', status: 'accepted', createdAt: '2026-05-07T18:00:00.000Z' },
  { id: 'friend-4', requesterId: 'user-luca', addresseeId: 'user-alex', status: 'pending', createdAt: '2026-05-08T18:00:00.000Z' },
];

export const blocks: Block[] = [
  { id: 'block-1', blockerId: 'user-alex', blockedId: 'user-random-1', createdAt: '2026-05-09T10:00:00.000Z' },
];

export const places: Place[] = sicilyPlaces;

export function createMockPresences(nightKey: string, activePlaces: Place[] = sicilyPlaces): NightlyPresence[] {
  const stamp = new Date().toISOString();
  const friendPlan = [
    ['user-sofia', 'place-pa-vucciria'],
    ['user-nico', 'place-ct-teatro-massimo'],
    ['user-marta', 'place-sr-ortigia'],
    ['user-luca', 'place-pa-mondello'],
    ['user-giulia', 'place-rg-marina'],
    ['user-random-1', 'place-pa-vucciria'],
  ] as const;

  const base = friendPlan.map(([userId, placeId], index) => ({
    id: `mock-presence-${index}`,
    userId,
    placeId,
    nightKey,
    createdAt: stamp,
    updatedAt: stamp,
  }));

  // popularityScore arriva da scoring 1-150; in demo scaliamo /8 così "stasera
  // in Sicilia" mostra ~1.500 persone credibili invece di ~30k fittizie.
  const crowd = activePlaces.flatMap((place) => {
    const raw = place.popularityScore ?? 12;
    const count = Math.max(0, Math.round(raw / 8));
    return Array.from({ length: count }, (_, index) => ({
      id: `crowd-${place.id}-${index}`,
      userId: `crowd-${place.id}-${index}`,
      placeId: place.id,
      nightKey,
      createdAt: stamp,
      updatedAt: stamp,
    }));
  });

  return [...base, ...crowd];
}

export const reports: Report[] = [
  { id: 'report-1', reporterId: 'user-sofia', placeId: 'place-pa-vucciria', reason: 'Controllare affollamento e foto del luogo nel weekend.', status: 'open', createdAt: '2026-05-10T09:00:00.000Z' },
];
