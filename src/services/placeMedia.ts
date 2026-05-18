import type { Place, PlaceMedia } from '../types';

export function buildPlaceMedia(
  place: Pick<Place, 'imageUrl' | 'imageCredit' | 'sourceUrl' | 'name' | 'category' | 'heroColor'>,
): PlaceMedia {
  return {
    uri: place.imageUrl,
    credit: normalizeCredit(place.imageCredit),
    sourceUrl: place.sourceUrl,
    fallbackAsset: 'splash',
    brand: {
      name: place.name,
      category: place.category,
      heroColor: place.heroColor,
    },
  };
}

function normalizeCredit(credit?: string) {
  const trimmed = credit?.trim();
  if (!trimmed) return 'Immagine curata dal team Io ci sono';
  return trimmed;
}
