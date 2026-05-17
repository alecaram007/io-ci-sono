#!/usr/bin/env node
// Render PNG app icons dal logo SVG.
// Uso: node scripts/render-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, '..', 'assets');

const targets = [
  { src: 'logo.svg', out: 'icon.png', size: 1024, background: '#0B0D10' },
  { src: 'logo.svg', out: 'splash-icon.png', size: 1024, background: '#0B0D10' },
  { src: 'logo-foreground.svg', out: 'adaptive-icon.png', size: 1024, background: 'transparent' },
  { src: 'logo.svg', out: 'favicon.png', size: 96, background: '#0B0D10' },
];

for (const target of targets) {
  const svg = await readFile(join(assets, target.src), 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: target.size },
    background: target.background === 'transparent' ? undefined : target.background,
  });
  const pngBuffer = resvg.render().asPng();
  await writeFile(join(assets, target.out), pngBuffer);
  console.log(`✓ ${target.out} (${target.size}px, ${pngBuffer.length} bytes)`);
}
