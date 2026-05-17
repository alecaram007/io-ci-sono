import { Platform } from 'react-native';

// Palette cinematografica — film nero italiano, oro champagne, rame caldo.
// I nomi legacy (acid/mint/flame/coral/blue) sono mantenuti come alias per minimizzare
// la cascata sui componenti, ma puntano ai nuovi valori "neo-cinema".
export const colors = {
  // Superfici — neri profondi con sottotono caldo
  ink: '#0B0D10',
  dusk: '#101317',
  panel: '#181C22',
  panelSoft: '#222931',

  // Luci — ivory tipografico, sabbia calda
  fog: '#F2EBDF',
  sand: '#E5D5BA',
  muted: '#8C9097',

  // Accenti cinematografici
  acid: '#D4B068',     // champagne gold — la signature
  amber: '#E2B065',    // amber caldo
  flame: '#B86A3E',    // rame raffinato
  mint: '#B0BFB7',     // eucalipto pallido
  blue: '#7C95B4',     // acciaio muto
  coral: '#C77E5A',    // ember
  danger: '#B4453F',   // vino profondo

  // Utility
  line: 'rgba(242, 235, 223, 0.08)',
  veil: 'rgba(11, 13, 16, 0.82)',
};

// rgba helpers per tinte sottili coerenti con la palette
export const tints = {
  gold: (alpha: number) => `rgba(212, 176, 104, ${alpha})`,
  copper: (alpha: number) => `rgba(184, 106, 62, ${alpha})`,
  steel: (alpha: number) => `rgba(124, 149, 180, ${alpha})`,
  pearl: (alpha: number) => `rgba(176, 191, 183, ${alpha})`,
  fog: (alpha: number) => `rgba(242, 235, 223, ${alpha})`,
  ink: (alpha: number) => `rgba(11, 13, 16, ${alpha})`,
  panel: (alpha: number) => `rgba(24, 28, 34, ${alpha})`,
  danger: (alpha: number) => `rgba(180, 69, 63, ${alpha})`,
};

export const fontPresets = {
  editorial: {
    display: Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'serif' }),
    body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'sans-serif' }),
    mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  legacy: {
    display: Platform.select({ ios: 'AvenirNextCondensed-Heavy', android: 'sans-serif-condensed', default: 'serif' }),
    body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'sans-serif' }),
    mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
};

export const fonts = fontPresets.editorial;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
};

export const radius = {
  pill: 999,
  sm: 14,
  md: 22,
  lg: 30,
  xl: 36,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  hard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 9,
  },
};
