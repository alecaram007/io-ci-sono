import type { AdminPlaceDraft } from '../types';

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateAdminPlaceDraft(draft: AdminPlaceDraft): string | null {
  if (!draft.name.trim()) return 'Inserisci il nome del luogo.';
  if (!draft.description.trim()) return 'Aggiungi una descrizione.';

  const latitude = parseCoordinate(draft.latitude);
  if (latitude === null || latitude < -90 || latitude > 90) {
    return 'Latitudine non valida (-90..90).';
  }

  const longitude = parseCoordinate(draft.longitude);
  if (longitude === null || longitude < -180 || longitude > 180) {
    return 'Longitudine non valida (-180..180).';
  }

  return null;
}
