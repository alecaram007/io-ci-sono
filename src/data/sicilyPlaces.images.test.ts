import { describe, expect, it } from 'vitest';
import { sicilyPlaces } from './sicilyPlaces';

const allowedImageHosts = new Set(['commons.wikimedia.org', 'upload.wikimedia.org']);

describe('sicily places media links', () => {
  it('uses valid HTTPS image URLs with supported Wikimedia patterns when set', () => {
    for (const place of sicilyPlaces) {
      if (!place.imageUrl) continue; // locali specifici: nessuna foto, brand card in UI

      const parsed = new URL(place.imageUrl);

      expect(parsed.protocol, `${place.id} image URL must be HTTPS`).toBe('https:');
      expect(allowedImageHosts.has(parsed.hostname), `${place.id} image host is unsupported`).toBe(true);

      if (parsed.hostname === 'commons.wikimedia.org') {
        expect(parsed.pathname, `${place.id} commons path must use Special:FilePath`).toContain('/wiki/Special:FilePath/');
        expect(parsed.searchParams.get('width'), `${place.id} commons URL must keep width=900`).toBe('900');
      }

      if (parsed.hostname === 'upload.wikimedia.org') {
        expect(parsed.pathname, `${place.id} upload URL should use thumbnail path`).toContain('/thumb/');
        expect(parsed.pathname, `${place.id} upload URL should pin 900px rendition`).toContain('/900px-');
      }
    }
  });

  it('uses valid HTTPS source URLs when an imageUrl is set', () => {
    for (const place of sicilyPlaces) {
      if (!place.imageUrl) continue;

      expect(place.sourceUrl, `${place.id} must define sourceUrl when imageUrl is present`).toBeTruthy();
      const source = new URL(place.sourceUrl as string);
      expect(source.protocol, `${place.id} source URL must be HTTPS`).toBe('https:');
    }
  });
});
