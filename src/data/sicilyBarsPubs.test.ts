import { describe, expect, it } from 'vitest';
import { sicilyBarsPubs } from './sicilyBarsPubs';

const SICILIAN_PROVINCES = ['PA', 'CT', 'ME', 'TP', 'AG', 'CL', 'EN', 'SR', 'RG'] as const;

describe('sicily bars and pubs coverage', () => {
  it('covers all Sicilian provinces with at least 8 venues each', () => {
    const countByProvince = new Map<string, number>();

    for (const place of sicilyBarsPubs) {
      countByProvince.set(place.province, (countByProvince.get(place.province) ?? 0) + 1);
    }

    for (const province of SICILIAN_PROVINCES) {
      expect(countByProvince.get(province) ?? 0).toBeGreaterThanOrEqual(8);
    }
  });

  it('has unique ids for every venue', () => {
    const ids = sicilyBarsPubs.map((place) => place.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
