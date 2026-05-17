import { describe, expect, it } from 'vitest';
import { buildPlaceMedia } from './placeMedia';

describe('buildPlaceMedia', () => {
  it('passes through imageUrl, credit and sourceUrl', () => {
    const media = buildPlaceMedia({
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
    expect(buildPlaceMedia({}).credit).toBe('Immagine curata dal team Io ci sono');
    expect(buildPlaceMedia({ imageCredit: '   ' }).credit).toBe('Immagine curata dal team Io ci sono');
  });

  it('trims credit whitespace', () => {
    expect(buildPlaceMedia({ imageCredit: '  Author  ' }).credit).toBe('Author');
  });

  it('keeps uri undefined when no imageUrl was provided', () => {
    expect(buildPlaceMedia({}).uri).toBeUndefined();
  });
});
