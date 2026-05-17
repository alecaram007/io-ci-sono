import { describe, expect, it } from 'vitest';
import { sicilyPlaces } from './sicilyPlaces';

const SICILIAN_PROVINCES = ['PA', 'CT', 'ME', 'TP', 'AG', 'CL', 'EN', 'SR', 'RG'] as const;

describe('sicily places integrity', () => {
  it('has unique ids in the merged dataset', () => {
    const ids = sicilyPlaces.map((place) => place.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps all provinces represented', () => {
    const countByProvince = new Map<string, number>();
    for (const place of sicilyPlaces) {
      countByProvince.set(place.province, (countByProvince.get(place.province) ?? 0) + 1);
    }

    for (const province of SICILIAN_PROVINCES) {
      expect(countByProvince.get(province) ?? 0).toBeGreaterThan(0);
    }
  });

  it('has valid finite coordinates for every place', () => {
    for (const place of sicilyPlaces) {
      expect(Number.isFinite(place.latitude)).toBe(true);
      expect(Number.isFinite(place.longitude)).toBe(true);
    }
  });
});
