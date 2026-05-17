import { countPresenceByPlace, getHeatLevel, getUserPresence } from '../domain/presence';
import { getVisibleFriendAvatars } from '../domain/privacy';
import type { Block, Friendship, NightlyPresence, Place, PlaceFilters, PlaceWithPresence, Profile } from '../types';

export type GeoCoords = { latitude: number; longitude: number };

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
  const userPresence = getUserPresence(presences, viewerId, nightKey);

  const projected = filterPlaces(places, filters).map((place) => {
    const totalCount = countPresenceByPlace(presences, place.id, nightKey);
    const visibleAvatars = getVisibleFriendAvatars({
      viewerId,
      placeId: place.id,
      nightKey,
      profiles,
      friendships,
      presences,
      blocks,
    });

    const distanceKm = coords ? haversineKm(coords, { latitude: place.latitude, longitude: place.longitude }) : undefined;

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
