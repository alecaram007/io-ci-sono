import { describe, expect, it } from 'vitest';
import { sicilyDirectoryVenues } from './sicilyDirectoryVenues';

const SICILIAN_PROVINCES = ['PA', 'CT', 'ME', 'TP', 'AG', 'CL', 'EN', 'SR', 'RG'] as const;

describe('sicily directory venues coverage', () => {
  it('covers all Sicilian provinces with directory venues', () => {
    const countByProvince = new Map<string, number>();

    for (const place of sicilyDirectoryVenues) {
      countByProvince.set(place.province, (countByProvince.get(place.province) ?? 0) + 1);
    }

    for (const province of SICILIAN_PROVINCES) {
      expect(countByProvince.get(province) ?? 0).toBeGreaterThan(0);
    }
  });

  it('has unique ids for all directory venues', () => {
    const ids = sicilyDirectoryVenues.map((place) => place.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
