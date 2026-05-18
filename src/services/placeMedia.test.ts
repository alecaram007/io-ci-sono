import { describe, expect, it } from 'vitest';
import { buildPlaceMedia } from './placeMedia';

const baseBrand = {
  name: 'Esempio',
  category: 'Bar',
  heroColor: '#D4B068',
};

describe('buildPlaceMedia', () => {
  it('passes through imageUrl, credit and sourceUrl', () => {
    const media = buildPlaceMedia({
      ...baseBrand,
      imageUrl: 'https://example.com/img.jpg',
      imageCredit: 'Author / CC BY-SA',
      sourceUrl: 'https://example.com/source',
    });

    expect(media.uri).toBe('https://example.com/img.jpg');
    expect(media.credit).toBe('Author / CC BY-SA');
    expect(media.sourceUrl).toBe('https://example.com/source');
    expect(media.fallbackAsset).toBe('splash');
  });

  it('falls back to default credit when missing or blank', () => {
    expect(buildPlaceMedia({ ...baseBrand }).credit).toBe('Immagine curata dal team Io ci sono');
    expect(buildPlaceMedia({ ...baseBrand, imageCredit: '   ' }).credit).toBe('Immagine curata dal team Io ci sono');
  });

  it('trims credit whitespace', () => {
    expect(buildPlaceMedia({ ...baseBrand, imageCredit: '  Author  ' }).credit).toBe('Author');
  });

  it('keeps uri undefined when no imageUrl was provided', () => {
    expect(buildPlaceMedia({ ...baseBrand }).uri).toBeUndefined();
  });

  it('exposes brand info for the no-photo fallback card', () => {
    const media = buildPlaceMedia({ ...baseBrand });
    expect(media.brand).toEqual(baseBrand);
  });
});
