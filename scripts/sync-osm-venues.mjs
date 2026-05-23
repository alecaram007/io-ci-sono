#!/usr/bin/env node
// Sync Sicilia bar/pub/discoteche/birrerie da OpenStreetMap via Overpass API.
//
// Genera src/data/sicilyOsmVenues.ts con coordinate ESATTE dal catasto OSM,
// nomi reali del cartello (non ragioni sociali), e una mappatura categoria
// → heroColor coerente col theme dell'app.
//
// Uso: node scripts/sync-osm-venues.mjs
// Niente API key. Overpass è gratis ma fragile: se va in timeout, riprova.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'sicilyOsmVenues.ts');

// Bounding box Sicilia (inclusi Lampedusa e Pantelleria):
// south=35.4 west=11.9 north=38.4 east=15.7
const SICILY_BBOX = [35.4, 11.9, 38.4, 15.7];

const QUERY = `[out:json][timeout:90];
(
  node["amenity"~"^(bar|pub|nightclub|biergarten)$"]["name"](${SICILY_BBOX.join(',')});
  way["amenity"~"^(bar|pub|nightclub|biergarten)$"]["name"](${SICILY_BBOX.join(',')});
);
out center;`;

const AMENITY_TO_CATEGORY = {
  bar: 'Cocktail bar',
  pub: 'Pub',
  nightclub: 'Discoteca',
  biergarten: 'Birreria',
};

const CATEGORY_TO_COLOR = {
  'Cocktail bar': '#c2ff45',
  Pub: '#ff7a1a',
  Discoteca: '#f26d8f',
  Birreria: '#f3d35b',
};

const CATEGORY_TO_VIBES = {
  'Cocktail bar': ['cocktail', 'lounge'],
  Pub: ['pub', 'birra'],
  Discoteca: ['discoteca', 'dj set', 'nightlife'],
  Birreria: ['birreria', 'beer garden'],
};

// Centri provinciali per assegnazione provincia dalla coord (nearest-neighbor).
const PROVINCE_CENTERS = {
  PA: [38.115, 13.361],
  CT: [37.502, 15.087],
  ME: [38.193, 15.554],
  AG: [37.311, 13.577],
  TP: [38.018, 12.514],
  SR: [37.066, 15.293],
  RG: [36.926, 14.731],
  CL: [37.491, 14.062],
  EN: [37.566, 14.273],
};

function nearestProvince(lat, lng) {
  let best = 'PA';
  let dist = Infinity;
  for (const [code, [plat, plng]] of Object.entries(PROVINCE_CENTERS)) {
    const d = Math.hypot(lat - plat, lng - plng);
    if (d < dist) {
      dist = d;
      best = code;
    }
  }
  return best;
}

const BUSINESS_NAME_PATTERNS = [
  /\bS\.\s*n\.\s*c\./i,
  /\bS\.\s*r\.\s*l\./i,
  /\bS\.\s*a\.\s*s\./i,
  /\bS\.\s*p\.\s*a\./i,
  /\bS\.\s*c\.\s*a\.\s*r\.\s*l\./i,
  /\b&\s*C\.?/,
  /\bdi\s+[A-ZÀ-Ý][a-zà-ÿ']+(?:'\s|\s)+[A-ZÀ-Ý][a-zà-ÿ']+/,
  /\bdi\s+[A-ZÀ-Ý][a-zà-ÿ']+\s+&\s+[A-ZÀ-Ý][a-zà-ÿ']+/,
];

function looksLikeRagioneSociale(name) {
  return BUSINESS_NAME_PATTERNS.some((re) => re.test(name));
}

const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

async function fetchOverpass() {
  const body = new URLSearchParams({ data: QUERY }).toString();
  let lastErr;
  for (const url of OVERPASS_MIRRORS) {
    console.log(`→ querying Overpass: ${url}`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'io-ci-sono-sync/1.0',
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        lastErr = new Error(`Overpass ${res.status} ${url}: ${txt.slice(0, 200)}`);
        console.log(`  ✘ ${res.status}, trying next mirror…`);
        continue;
      }
      const json = await res.json();
      return json.elements || [];
    } catch (err) {
      lastErr = err;
      console.log(`  ✘ ${err.message?.slice(0, 200)}, trying next mirror…`);
    }
  }
  throw lastErr || new Error('All Overpass mirrors failed');
}

function elementToPlace(el) {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const tags = el.tags || {};
  const name = (tags.name || '').trim();
  if (!name || name.length < 2) return null;
  if (looksLikeRagioneSociale(name)) return null;

  const amenity = tags.amenity;
  const category = AMENITY_TO_CATEGORY[amenity];
  if (!category) return null;

  const city = (tags['addr:city'] || tags['addr:hamlet'] || tags['addr:suburb'] || '').trim();
  const province = nearestProvince(lat, lng);
  const heroColor = CATEGORY_TO_COLOR[category];
  const vibeTags = CATEGORY_TO_VIBES[category];

  return {
    id: `place-osm-${el.type}-${el.id}`,
    name,
    category,
    description: city
      ? `${category} a ${city}. Riferimento serale segnalato su OpenStreetMap.`
      : `${category} in Sicilia. Riferimento serale segnalato su OpenStreetMap.`,
    city,
    province,
    region: 'Sicilia',
    country: 'Italia',
    latitude: lat,
    longitude: lng,
    timezone: 'Europe/Rome',
    heroColor,
    vibeTags,
    sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    popularityScore: 40,
    isActive: true,
  };
}

(async () => {
  const elements = await fetchOverpass();
  console.log(`← raw elements: ${elements.length}`);

  const mapped = elements.map(elementToPlace).filter(Boolean);
  console.log(`  after map+name+filter: ${mapped.length}`);

  // Dedup per name+city (case insensitive)
  const seen = new Map();
  for (const p of mapped) {
    const key = `${p.name.toLowerCase()}|${p.city.toLowerCase()}|${p.category}`;
    if (!seen.has(key)) seen.set(key, p);
  }
  const unique = [...seen.values()];
  console.log(`  unique: ${unique.length}`);

  // Bias popularityScore: discoteche > cocktail bar > pub > birreria
  const SCORE_BIAS = { Discoteca: 70, 'Cocktail bar': 55, Pub: 45, Birreria: 38 };
  for (const p of unique) {
    p.popularityScore = SCORE_BIAS[p.category] ?? 40;
  }

  // Sort by province → city → name per output stabile
  unique.sort((a, b) => a.province.localeCompare(b.province) || a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

  await mkdir(dirname(OUT_PATH), { recursive: true });
  const banner = `// AUTO-GENERATED da scripts/sync-osm-venues.mjs · NON modificare a mano.
// Fonte dati: OpenStreetMap (Overpass API) · licenza ODbL.
// Rigenerare con: \`node scripts/sync-osm-venues.mjs\`.
import type { Place } from '../types';

`;
  const body = `export const sicilyOsmVenues: Place[] = ${JSON.stringify(unique, null, 2)};\n`;
  await writeFile(OUT_PATH, banner + body, 'utf8');

  console.log(`✓ wrote ${unique.length} venues to ${OUT_PATH.replace(__dirname + '/..', '.')}`);
})();
