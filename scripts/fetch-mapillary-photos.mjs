#!/usr/bin/env node
// Fetch the closest Mapillary street-level photo for each "specific venue" place
// (those without an imageUrl) and download it as a local asset with attribution.
//
// Usage:
//   MAPILLARY_TOKEN="MLY|..." node scripts/fetch-mapillary-photos.mjs
//
// Reads `src/data/sicilyPlaces.ts` source, finds the array literal, and for any
// place without `imageUrl` queries Mapillary Graph API around its lat/lng. Saves:
//   - PNG/JPG file in assets/places/<place-id>.jpg
//   - metadata JSON entry in src/data/placePhotos.generated.json with id,
//     creator, mapillary_id, captured_at, source_url, license.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const sourceFile = join(projectRoot, 'src', 'data', 'sicilyPlaces.ts');
const photosFile = join(projectRoot, 'src', 'data', 'placePhotos.generated.json');
const assetsDir = join(projectRoot, 'assets', 'places');

const token = process.env.MAPILLARY_TOKEN;
if (!token) {
  console.error('Missing MAPILLARY_TOKEN env var.');
  process.exit(1);
}

const RADII_KM = [0.5, 1, 2, 4]; // try progressively wider bboxes

function bboxAround(lat, lng, km) {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function mapillaryClosest(lat, lng) {
  for (const km of RADII_KM) {
    const [w, s, e, n] = bboxAround(lat, lng, km);
    const url = `https://graph.mapillary.com/images?bbox=${w},${s},${e},${n}&limit=20&fields=id,thumb_2048_url,creator,captured_at,geometry`;
    const res = await fetch(url, { headers: { Authorization: `OAuth ${token}` } });
    if (!res.ok) {
      console.warn(`  [mapillary ${res.status}] bbox ${km}km`);
      continue;
    }
    const json = await res.json();
    const items = (json.data || []).map((img) => ({
      ...img,
      lng: img.geometry.coordinates[0],
      lat: img.geometry.coordinates[1],
      distanceKm: haversineKm(
        { lat, lng },
        { lat: img.geometry.coordinates[1], lng: img.geometry.coordinates[0] },
      ),
    }));
    if (items.length === 0) continue;
    items.sort((a, b) => a.distanceKm - b.distanceKm);
    return items[0];
  }
  return null;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  await pipeline(res.body, createWriteStream(destPath));
}

// Parse sicilyPlaces.ts source to find all { id, name, ..., latitude, longitude, ... }
// entries that DO NOT have an explicit imageUrl property in their literal. We use
// a simple regex pass — the file format is line-per-object so it's reliable.
async function readSpecificVenues() {
  const src = await readFile(sourceFile, 'utf8');
  // Match each object literal "{...}," after coreSicilyPlaces (greedy multi-line via [\s\S])
  const objectRegex = /\{\s*id:\s*'([^']+)',[\s\S]*?\bisActive:\s*(?:true|false),?\s*\}/g;
  const venues = [];
  let match;
  while ((match = objectRegex.exec(src))) {
    const block = match[0];
    const id = match[1];
    if (/imageUrl:/.test(block)) continue; // already has photo
    const lat = parseFloat((block.match(/latitude:\s*([-\d.]+)/) || [])[1]);
    const lng = parseFloat((block.match(/longitude:\s*([-\d.]+)/) || [])[1]);
    const name = (block.match(/name:\s*'([^']+)'/) || [])[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    venues.push({ id, name, lat, lng });
  }
  return venues;
}

async function main() {
  await mkdir(assetsDir, { recursive: true });
  const venues = await readSpecificVenues();
  console.log(`Targeting ${venues.length} venues without imageUrl.`);

  const existing = await loadExisting();
  const out = { ...existing };

  for (const venue of venues) {
    if (out[venue.id]) {
      console.log(`  · ${venue.id} already has photo, skipping`);
      continue;
    }
    console.log(`\n→ ${venue.name} (${venue.id}) @ ${venue.lat}, ${venue.lng}`);
    try {
      const photo = await mapillaryClosest(venue.lat, venue.lng);
      if (!photo) {
        console.log(`  ✗ no Mapillary photo within ${RADII_KM[RADII_KM.length - 1]}km`);
        continue;
      }
      console.log(`  ✓ photo ${photo.id} by @${photo.creator.username} at ${photo.distanceKm.toFixed(2)}km`);
      const filename = `${venue.id}.jpg`;
      await downloadImage(photo.thumb_2048_url, join(assetsDir, filename));
      out[venue.id] = {
        asset: `assets/places/${filename}`,
        mapillary_id: photo.id,
        creator: photo.creator.username,
        captured_at: photo.captured_at,
        distance_km: Number(photo.distanceKm.toFixed(3)),
        source_url: `https://www.mapillary.com/app/?image_key=${photo.id}`,
        license: 'CC-BY-SA 4.0',
        credit: `Foto street-level di @${photo.creator.username} · Mapillary · CC BY-SA 4.0`,
      };
      // throttle to be polite
      await sleep(400);
    } catch (err) {
      console.warn(`  ✗ ${err.message}`);
    }
  }

  await writeFile(photosFile, JSON.stringify(out, null, 2) + '\n');
  console.log(`\nWrote ${Object.keys(out).length} entries to ${photosFile}`);
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(photosFile, 'utf8'));
  } catch {
    return {};
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
