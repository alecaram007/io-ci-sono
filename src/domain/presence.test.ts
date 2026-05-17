import { describe, expect, it } from 'vitest';
import type { NightlyPresence } from '../types';
import { clearPresence, countPresenceByPlace, getHeatLevel, getUserPresence, setPresence } from './presence';

const now = new Date('2026-05-10T20:00:00.000Z');

describe('presence rules', () => {
  it('adds the first presence for a night', () => {
    const presences = setPresence({ presences: [], userId: 'u1', placeId: 'p1', nightKey: 'Europe/Rome:2026-05-10', now });
    expect(presences).toHaveLength(1);
    expect(getUserPresence(presences, 'u1', 'Europe/Rome:2026-05-10')?.placeId).toBe('p1');
  });

  it('moves presence instead of creating duplicates', () => {
    const initial: NightlyPresence[] = [
      { id: 'existing', userId: 'u1', placeId: 'p1', nightKey: 'Europe/Rome:2026-05-10', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    ];

    const moved = setPresence({ presences: initial, userId: 'u1', placeId: 'p2', nightKey: 'Europe/Rome:2026-05-10', now });
    expect(moved).toHaveLength(1);
    expect(moved[0].placeId).toBe('p2');
    expect(countPresenceByPlace(moved, 'p1', 'Europe/Rome:2026-05-10')).toBe(0);
    expect(countPresenceByPlace(moved, 'p2', 'Europe/Rome:2026-05-10')).toBe(1);
  });

  it('allows a different night key without touching the prior night', () => {
    const initial = setPresence({ presences: [], userId: 'u1', placeId: 'p1', nightKey: 'Europe/Rome:2026-05-10', now });
    const nextNight = setPresence({ presences: initial, userId: 'u1', placeId: 'p2', nightKey: 'Europe/Rome:2026-05-11', now });
    expect(nextNight).toHaveLength(2);
  });

  it('refreshes updatedAt when re-confirming the same place', () => {
    const initial = setPresence({ presences: [], userId: 'u1', placeId: 'p1', nightKey: 'n1', now });
    const later = new Date('2026-05-10T22:00:00.000Z');
    const refreshed = setPresence({ presences: initial, userId: 'u1', placeId: 'p1', nightKey: 'n1', now: later });
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0].updatedAt).toBe(later.toISOString());
    expect(refreshed[0].createdAt).toBe(initial[0].createdAt);
  });

  it('clears presence for the given night without touching other nights', () => {
    const nightA: NightlyPresence[] = [
      { id: 'a1', userId: 'u1', placeId: 'p1', nightKey: 'n1', createdAt: 'now', updatedAt: 'now' },
      { id: 'a2', userId: 'u1', placeId: 'p2', nightKey: 'n2', createdAt: 'now', updatedAt: 'now' },
      { id: 'a3', userId: 'u2', placeId: 'p1', nightKey: 'n1', createdAt: 'now', updatedAt: 'now' },
    ];
    expect(clearPresence(nightA, 'u1', 'n1')).toEqual([
      { id: 'a2', userId: 'u1', placeId: 'p2', nightKey: 'n2', createdAt: 'now', updatedAt: 'now' },
      { id: 'a3', userId: 'u2', placeId: 'p1', nightKey: 'n1', createdAt: 'now', updatedAt: 'now' },
    ]);
  });
});

describe('heat level thresholds', () => {
  it('returns quiet for low counts', () => {
    expect(getHeatLevel(0)).toBe('quiet');
    expect(getHeatLevel(11)).toBe('quiet');
  });

  it('returns warming starting at 12', () => {
    expect(getHeatLevel(12)).toBe('warming');
    expect(getHeatLevel(44)).toBe('warming');
  });

  it('returns hot starting at 45', () => {
    expect(getHeatLevel(45)).toBe('hot');
    expect(getHeatLevel(89)).toBe('hot');
  });

  it('returns wild starting at 90', () => {
    expect(getHeatLevel(90)).toBe('wild');
    expect(getHeatLevel(500)).toBe('wild');
  });
});
