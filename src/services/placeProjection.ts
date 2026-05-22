import { getHeatLevel, getUserPresence, isPresenceFresh } from '../domain/presence';
import { getAcceptedFriendIds, isBlockedBetween } from '../domain/privacy';
import type {
  Block,
  Friendship,
  NightlyPresence,
  Place,
  PlaceFilters,
  PlaceWithPresence,
  Profile,
  VisibleAvatar,
} from '../types';

export type GeoCoords = { latitude: number; longitude: number };

const FRIEND_AVATAR_LIMIT = 5;

export function filterPlaces(places: Place[], filters: PlaceFilters) {
  const query = filters.query.trim().toLowerCase();

  return places.filter((place) => {
    if (!place.isActive) return false;

    const matchesQuery = !query || [place.name, place.category, place.description, place.city, ...place.vibeTags]
      .join(' ')
      .toLowerCase()
      .includes(query);

    const matchesCity = !filters.city || place.city === filters.city;
    const matchesProvince = !filters.province || place.province === filters.province;
    const matchesRegion = !filters.region || place.region === filters.region;
    const matchesCountry = !filters.country || place.country === filters.country;

    return matchesQuery && matchesCity && matchesProvince && matchesRegion && matchesCountry;
  });
}

/** Haversine distance in km between two coords. */
export function haversineKm(a: GeoCoords, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

type PresenceIndex = {
  countByPlace: Map<string, number>;
  presencesByPlace: Map<string, NightlyPresence[]>;
};

function buildPresenceIndex(presences: NightlyPresence[], nightKey: string): PresenceIndex {
  const countByPlace = new Map<string, number>();
  const presencesByPlace = new Map<string, NightlyPresence[]>();
  const now = new Date();

  for (const presence of presences) {
    if (presence.nightKey !== nightKey) continue;
    if (!isPresenceFresh(presence, now)) continue; // scade dopo 4h: niente fantasmi
    countByPlace.set(presence.placeId, (countByPlace.get(presence.placeId) ?? 0) + 1);
    let bucket = presencesByPlace.get(presence.placeId);
    if (!bucket) {
      bucket = [];
      presencesByPlace.set(presence.placeId, bucket);
    }
    bucket.push(presence);
  }

  return { countByPlace, presencesByPlace };
}

function buildVisibleAvatarsLookup(input: {
  viewerId: string;
  profiles: Profile[];
  friendships: Friendship[];
  blocks: Block[];
  index: PresenceIndex;
}) {
  const { viewerId, profiles, friendships, blocks, index } = input;
  const friendIds = new Set(getAcceptedFriendIds(friendships, viewerId));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (placeId: string): VisibleAvatar[] => {
    const bucket = index.presencesByPlace.get(placeId);
    if (!bucket || friendIds.size === 0) return [];

    const out: VisibleAvatar[] = [];
    for (const presence of bucket) {
      if (out.length >= FRIEND_AVATAR_LIMIT) break;
      if (!friendIds.has(presence.userId)) continue;
      if (presence.isIncognito) continue; // modalità invisibile: conta nel totale, non si mostra
      if (isBlockedBetween(blocks, viewerId, presence.userId)) continue;
      const profile = profileById.get(presence.userId);
      if (!profile) continue;
      out.push({
        id: profile.id,
        nickname: profile.nickname,
        displayName: profile.displayName,
        avatarColor: profile.avatarColor,
        avatarUrl: profile.avatarUrl,
      });
    }
    return out;
  };
}

export function projectPlacesWithPresence(input: {
  places: Place[];
  profiles: Profile[];
  friendships: Friendship[];
  blocks: Block[];
  presences: NightlyPresence[];
  viewerId: string;
  nightKey: string;
  filters: PlaceFilters;
  coords?: GeoCoords | null;
}): PlaceWithPresence[] {
  const { places, profiles, friendships, blocks, presences, viewerId, nightKey, filters, coords } = input;

  const index = buildPresenceIndex(presences, nightKey);
  const userPresence = getUserPresence(presences, viewerId, nightKey);
  const visibleAvatarsFor = buildVisibleAvatarsLookup({ viewerId, profiles, friendships, blocks, index });

  const projected = filterPlaces(places, filters).map((place) => {
    const totalCount = index.countByPlace.get(place.id) ?? 0;
    const visibleAvatars = visibleAvatarsFor(place.id);
    const distanceKm = coords
      ? haversineKm(coords, { latitude: place.latitude, longitude: place.longitude })
      : undefined;

    return {
      ...place,
      totalCount,
      visibleAvatars,
      friendCount: visibleAvatars.length,
      isUserHere: userPresence?.placeId === place.id,
      heatLevel: getHeatLevel(totalCount),
      distanceKm,
    };
  });

  if (coords) {
    projected.sort((first, second) => {
      if (first.isUserHere !== second.isUserHere) return Number(second.isUserHere) - Number(first.isUserHere);
      const da = first.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = second.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return second.totalCount - first.totalCount;
    });
  } else {
    projected.sort((first, second) => Number(second.isUserHere) - Number(first.isUserHere) || second.totalCount - first.totalCount);
  }

  return projected;
}

export function distinctValues<T extends keyof Pick<Place, 'city' | 'province' | 'region' | 'country'>>(places: Place[], key: T) {
  return Array.from(new Set(places.filter((place) => place.isActive).map((place) => place[key]))).sort();
}
