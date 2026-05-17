import { describe, expect, it } from 'vitest';
import type { AdminPlaceDraft } from '../types';
import { validateAdminPlaceDraft } from './adminPlace';

const valid: AdminPlaceDraft = {
  name: 'Bar Nuovo',
  category: 'Bar',
  city: 'Palermo',
  province: 'PA',
  region: 'Sicilia',
  country: 'Italia',
  latitude: '38.1',
  longitude: '13.36',
  description: 'Piazza viva la sera.',
};

describe('validateAdminPlaceDraft', () => {
  it('accepts a complete draft', () => {
    expect(validateAdminPlaceDraft(valid)).toBeNull();
  });

  it('rejects empty name and description', () => {
    expect(validateAdminPlaceDraft({ ...valid, name: '   ' })).toMatch(/nome/i);
    expect(validateAdminPlaceDraft({ ...valid, description: '' })).toMatch(/descrizione/i);
  });

  it('rejects non numeric coordinates', () => {
    expect(validateAdminPlaceDraft({ ...valid, latitude: 'abc' })).toMatch(/latitudine/i);
    expect(validateAdminPlaceDraft({ ...valid, longitude: '' })).toMatch(/longitudine/i);
  });

  it('rejects out-of-range coordinates', () => {
    expect(validateAdminPlaceDraft({ ...valid, latitude: '95' })).toMatch(/latitudine/i);
    expect(validateAdminPlaceDraft({ ...valid, longitude: '-181' })).toMatch(/longitudine/i);
  });

  it('accepts edge boundary coordinates', () => {
    expect(validateAdminPlaceDraft({ ...valid, latitude: '90', longitude: '-180' })).toBeNull();
    expect(validateAdminPlaceDraft({ ...valid, latitude: '-90', longitude: '180' })).toBeNull();
  });
});
