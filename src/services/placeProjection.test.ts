import { describe, expect, it } from 'vitest';
import type { Block, Friendship, NightlyPresence, Place, PlaceFilters, Profile } from '../types';
import { distinctValues, filterPlaces, projectPlacesWithPresence } from './placeProjection';

const basePlace: Omit<Place, 'id' | 'name' | 'city' | 'province' | 'region' | 'country'> = {
  category: 'Bar',
  description: 'Locale',
  latitude: 0,
  longitude: 0,
  timezone: 'Europe/Rome',
  heroColor: '#fff',
  vibeTags: ['cocktail'],
  isActive: true,
};

const places: Place[] = [
  { ...basePlace, id: 'p1', name: 'Bar Mondello', city: 'Palermo', province: 'PA', region: 'Sicilia', country: 'Italia' },
  { ...basePlace, id: 'p2', name: 'Pub Catania', city: 'Catania', province: 'CT', region: 'Sicilia', country: 'Italia' },
  { ...basePlace, id: 'p3', name: 'Locale Inattivo', city: 'Messina', province: 'ME', region: 'Sicilia', country: 'Italia', isActive: false },
];

const emptyFilters: PlaceFilters = { query: '', city: '', province: '', region: '', country: '' };

describe('filterPlaces', () => {
  it('omits inactive places', () => {
    const result = filterPlaces(places, emptyFilters);
    expect(result.map((place) => place.id)).toEqual(['p1', 'p2']);
  });

  it('matches query against name, category, description, city, tags', () => {
    expect(filterPlaces(places, { ...emptyFilters, query: 'mondello' }).map((p) => p.id)).toEqual(['p1']);
    expect(filterPlaces(places, { ...emptyFilters, query: 'COCKTAIL' }).map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(filterPlaces(places, { ...emptyFilters, query: 'no-match' })).toHaveLength(0);
  });

  it('filters by exact geographic field', () => {
    expect(filterPlaces(places, { ...emptyFilters, city: 'Catania' }).map((p) => p.id)).toEqual(['p2']);
    expect(filterPlaces(places, { ...emptyFilters, province: 'PA' }).map((p) => p.id)).toEqual(['p1']);
    expect(filterPlaces(places, { ...emptyFilters, country: 'Italia' })).toHaveLength(2);
  });
});

describe('projectPlacesWithPresence', () => {
  const profiles: Profile[] = [
    { id: 'viewer', nickname: 'me', displayName: 'Me', avatarColor: '#fff', ageConfirmed: true, role: 'user', friendCode: 'M' },
    { id: 'friend', nickname: 'f', displayName: 'Friend', avatarColor: '#000', ageConfirmed: true, role: 'user', friendCode: 'F' },
    { id: 'stranger', nickname: 's', displayName: 'Stranger', avatarColor: '#111', ageConfirmed: true, role: 'user', friendCode: 'S' },
  ];

  const friendships: Friendship[] = [
    { id: 'fr1', requesterId: 'viewer', addresseeId: 'friend', status: 'accepted', createdAt: 'now' },
  ];

  const blocks: Block[] = [];

  const nightKey = 'Europe/Rome:2026-05-10';

  const presences: NightlyPresence[] = [
    { id: 'pr1', userId: 'viewer', placeId: 'p1', nightKey, createdAt: 'now', updatedAt: 'now' },
    { id: 'pr2', userId: 'friend', placeId: 'p1', nightKey, createdAt: 'now', updatedAt: 'now' },
    { id: 'pr3', userId: 'stranger', placeId: 'p2', nightKey, createdAt: 'now', updatedAt: 'now' },
  ];

  it('flags the viewer presence and counts totals', () => {
    const result = projectPlacesWithPresence({
      places,
      profiles,
      friendships,
      blocks,
      presences,
      viewerId: 'viewer',
      nightKey,
      filters: emptyFilters,
    });

    const p1 = result.find((place) => place.id === 'p1');
    const p2 = result.find((place) => place.id === 'p2');

    expect(p1?.isUserHere).toBe(true);
    expect(p1?.totalCount).toBe(2);
    expect(p1?.visibleAvatars.map((avatar) => avatar.id)).toEqual(['friend']);
    expect(p2?.isUserHere).toBe(false);
    expect(p2?.totalCount).toBe(1);
    expect(p2?.visibleAvatars).toHaveLength(0);
  });

  it('sorts user-here first, then by totalCount desc', () => {
    const extra: NightlyPresence[] = [
      ...presences,
      { id: 'pr4', userId: 'a', placeId: 'p2', nightKey, createdAt: 'now', updatedAt: 'now' },
      { id: 'pr5', userId: 'b', placeId: 'p2', nightKey, createdAt: 'now', updatedAt: 'now' },
      { id: 'pr6', userId: 'c', placeId: 'p2', nightKey, createdAt: 'now', updatedAt: 'now' },
    ];

    const result = projectPlacesWithPresence({
      places,
      profiles,
      friendships,
      blocks,
      presences: extra,
      viewerId: 'viewer',
      nightKey,
      filters: emptyFilters,
    });

    expect(result.map((place) => place.id)).toEqual(['p1', 'p2']);
  });

  it('assigns heat level based on total count', () => {
    const crowd: NightlyPresence[] = Array.from({ length: 50 }, (_, i) => ({
      id: `c${i}`,
      userId: `u${i}`,
      placeId: 'p2',
      nightKey,
      createdAt: 'now',
      updatedAt: 'now',
    }));

    const result = projectPlacesWithPresence({
      places,
      profiles,
      friendships,
      blocks,
      presences: crowd,
      viewerId: 'viewer',
      nightKey,
      filters: emptyFilters,
    });

    expect(result.find((place) => place.id === 'p2')?.heatLevel).toBe('hot');
  });
});

describe('distinctValues', () => {
  it('returns sorted unique values from active places only', () => {
    expect(distinctValues(places, 'province')).toEqual(['CT', 'PA']);
    expect(distinctValues(places, 'country')).toEqual(['Italia']);
  });
});
