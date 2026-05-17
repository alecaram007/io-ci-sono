import type { Place, PlaceMedia } from '../types';

export function buildPlaceMedia(place: Pick<Place, 'imageUrl' | 'imageCredit' | 'sourceUrl'>): PlaceMedia {
  return {
    uri: place.imageUrl,
    credit: normalizeCredit(place.imageCredit),
    sourceUrl: place.sourceUrl,
    fallbackAsset: 'splash',
  };
}

function normalizeCredit(credit?: string) {
  const trimmed = credit?.trim();
  if (!trimmed) return 'Immagine curata dal team Io ci sono';
  return trimmed;
}
