import { describe, expect, it } from 'vitest';
import { sicilyPlaces } from './sicilyPlaces';

const allowedImageHosts = new Set(['commons.wikimedia.org', 'upload.wikimedia.org']);

describe('sicily places media links', () => {
  it('uses valid HTTPS image URLs with supported Wikimedia patterns', () => {
    for (const place of sicilyPlaces) {
      expect(place.imageUrl, `${place.id} must define imageUrl`).toBeTruthy();
      const imageUrl = place.imageUrl as string;
      const parsed = new URL(imageUrl);

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

  it('uses valid HTTPS source URLs for every place', () => {
    for (const place of sicilyPlaces) {
      expect(place.sourceUrl, `${place.id} must define sourceUrl`).toBeTruthy();
      const source = new URL(place.sourceUrl as string);
      expect(source.protocol, `${place.id} source URL must be HTTPS`).toBe('https:');
    }
  });
});
