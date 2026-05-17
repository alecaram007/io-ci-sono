import type { PlaceWithPresence } from '../types';

export function applyOptimisticPresence(places: PlaceWithPresence[], placeId: string): PlaceWithPresence[] {
  const previous = places.find((place) => place.isUserHere);
  const alreadyHere = previous?.id === placeId;

  return places.map((place) => {
    if (place.id === placeId) {
      return {
        ...place,
        isUserHere: true,
        totalCount: alreadyHere ? place.totalCount : place.totalCount + 1,
      };
    }

    if (place.isUserHere) {
      return {
        ...place,
        isUserHere: false,
        totalCount: Math.max(0, place.totalCount - 1),
      };
    }

    return place;
  });
}
