import type { NightlyPresence } from '../types';

type SetPresenceInput = {
  presences: NightlyPresence[];
  userId: string;
  placeId: string;
  nightKey: string;
  isIncognito?: boolean;
  now?: Date;
};

/**
 * Una presenza si considera "viva" se aggiornata negli ultimi PRESENCE_FRESHNESS_MS.
 * Dopo, scade automaticamente — niente fantasmi nei conteggi.
 */
export const PRESENCE_FRESHNESS_MS = 4 * 60 * 60 * 1000;

export function isPresenceFresh(presence: NightlyPresence, now: Date = new Date()): boolean {
  const updated = Date.parse(presence.updatedAt);
  if (Number.isNaN(updated)) return true;
  return now.getTime() - updated <= PRESENCE_FRESHNESS_MS;
}

export function setPresence({ presences, userId, placeId, nightKey, isIncognito, now = new Date() }: SetPresenceInput) {
  const stamp = now.toISOString();
  const existing = presences.find((presence) => presence.userId === userId && presence.nightKey === nightKey);

  if (existing?.placeId === placeId) {
    return presences.map((presence) =>
      presence.id === existing.id
        ? { ...presence, updatedAt: stamp, isIncognito: isIncognito ?? presence.isIncognito ?? false }
        : presence,
    );
  }

  const withoutCurrentNight = presences.filter(
    (presence) => !(presence.userId === userId && presence.nightKey === nightKey),
  );

  return [
    ...withoutCurrentNight,
    {
      id: existing?.id ?? `presence-${userId}-${nightKey}`,
      userId,
      placeId,
      nightKey,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
      isIncognito: isIncognito ?? false,
    },
  ];
}

export function clearPresence(presences: NightlyPresence[], userId: string, nightKey: string) {
  return presences.filter((presence) => !(presence.userId === userId && presence.nightKey === nightKey));
}

export function getUserPresence(presences: NightlyPresence[], userId: string, nightKey: string) {
  return presences.find((presence) => presence.userId === userId && presence.nightKey === nightKey) ?? null;
}

export function countPresenceByPlace(presences: NightlyPresence[], placeId: string, nightKey: string) {
  return presences.filter((presence) => presence.placeId === placeId && presence.nightKey === nightKey).length;
}

export function getHeatLevel(count: number): 'quiet' | 'warming' | 'hot' | 'wild' {
  if (count >= 90) return 'wild';
  if (count >= 45) return 'hot';
  if (count >= 12) return 'warming';
  return 'quiet';
}
