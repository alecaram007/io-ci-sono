import { describe, expect, it } from 'vitest';
import type { PlaceWithPresence } from '../types';
import { applyOptimisticPresence } from './optimisticPresence';

function makePlace(overrides: Partial<PlaceWithPresence>): PlaceWithPresence {
  return {
    id: overrides.id ?? 'p',
    name: 'Place',
    category: 'Bar',
    description: '',
    city: 'Palermo',
    province: 'PA',
    region: 'Sicilia',
    country: 'Italia',
    latitude: 0,
    longitude: 0,
    timezone: 'Europe/Rome',
    heroColor: '#fff',
    vibeTags: [],
    isActive: true,
    totalCount: 0,
    friendCount: 0,
    visibleAvatars: [],
    isUserHere: false,
    heatLevel: 'quiet',
    ...overrides,
  };
}

describe('applyOptimisticPresence', () => {
  it('marks the target place as user-here and increments its total', () => {
    const places = [makePlace({ id: 'a', totalCount: 5 }), makePlace({ id: 'b', totalCount: 8 })];
    const next = applyOptimisticPresence(places, 'a');
    expect(next[0]).toMatchObject({ id: 'a', isUserHere: true, totalCount: 6 });
    expect(next[1]).toMatchObject({ id: 'b', isUserHere: false, totalCount: 8 });
  });

  it('moves user presence and decrements the previous place', () => {
    const places = [
      makePlace({ id: 'a', isUserHere: true, totalCount: 5 }),
      makePlace({ id: 'b', totalCount: 8 }),
    ];
    const next = applyOptimisticPresence(places, 'b');
    expect(next[0]).toMatchObject({ id: 'a', isUserHere: false, totalCount: 4 });
    expect(next[1]).toMatchObject({ id: 'b', isUserHere: true, totalCount: 9 });
  });

  it('keeps total stable when reconfirming the same place', () => {
    const places = [makePlace({ id: 'a', isUserHere: true, totalCount: 5 })];
    const next = applyOptimisticPresence(places, 'a');
    expect(next[0]).toMatchObject({ id: 'a', isUserHere: true, totalCount: 5 });
  });

  it('never decrements below zero', () => {
    const places = [
      makePlace({ id: 'a', isUserHere: true, totalCount: 0 }),
      makePlace({ id: 'b', totalCount: 0 }),
    ];
    const next = applyOptimisticPresence(places, 'b');
    expect(next[0].totalCount).toBe(0);
    expect(next[1].totalCount).toBe(1);
  });

  it('returns the same length array', () => {
    const places = [makePlace({ id: 'a' }), makePlace({ id: 'b' }), makePlace({ id: 'c' })];
    expect(applyOptimisticPresence(places, 'b')).toHaveLength(3);
  });
});
