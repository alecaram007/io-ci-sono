import { describe, expect, it } from 'vitest';
import { sicilyNightclubs } from './sicilyNightclubs';

const SICILIAN_PROVINCES = ['PA', 'CT', 'ME', 'TP', 'AG', 'CL', 'EN', 'SR', 'RG'] as const;

describe('sicily nightclubs coverage', () => {
  it('covers all Sicilian provinces with at least one nightclub entry', () => {
    const countByProvince = new Map<string, number>();

    for (const place of sicilyNightclubs) {
      countByProvince.set(place.province, (countByProvince.get(place.province) ?? 0) + 1);
    }

    for (const province of SICILIAN_PROVINCES) {
      expect(countByProvince.get(province) ?? 0).toBeGreaterThan(0);
    }
  });

  it('has unique ids for every nightclub entry', () => {
    const ids = sicilyNightclubs.map((place) => place.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
