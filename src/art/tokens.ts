/**
 * ART BIBLE IN CODE — single source of truth for every color, radius, font, shadow and layer.
 * See docs/ART_BIBLE.md. Never hard-code visual values elsewhere; import them from here.
 */

export const palette = {
  sage: '#9cbf8a',
  sageDeep: '#6f9a64',
  sageDark: '#4f7a52',
  cream: '#fbf3e1',
  creamDeep: '#f1e2c2',
  wood: '#a8764a',
  woodDeep: '#7a5232',
  woodLight: '#d3a774',
  sky: '#a8d8ef',
  skyLight: '#dff1f5',
  earth: '#b98a5e',
  earthDeep: '#8a6142',
  ink: '#4a3426',
  blossom: '#f4a9a8',
  berry: '#d9707a',
  sun: '#ffd97a',
  correct: '#7fbf6a',
  gentleWrong: '#e8a05c',
  energy: '#6fc3d9',
} as const;

export type PaletteKey = keyof typeof palette;

/** How strongly each parallax layer is mixed toward the horizon sky (aerial perspective). */
export const haze = {
  far: 0.55,
  midFar: 0.32,
  mid: 0.12,
} as const;

export const outline = {
  character: 3,
  prop: 3,
  small: 2,
} as const;

export const radii = {
  panel: 16,
  card: 12,
  pill: 999,
} as const;

export const fonts = {
  ui: '"Fredoka", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif',
  canvas: '600 20px Fredoka',
} as const;

export const motion = {
  uiMs: 180,
  sceneFadeMs: 350,
  maxSquash: 0.12,
} as const;

/** Parallax layer table (ART_BIBLE §5). factor = how much the layer follows the camera. */
export const layers = {
  sky: { factor: 0.0, z: -100, order: 0 },
  far: { factor: 0.15, z: -80, order: 10 },
  midFar: { factor: 0.4, z: -60, order: 20 },
  mid: { factor: 0.7, z: -40, order: 30 },
  play: { factor: 1.0, z: 0, order: 40 },
  foreground: { factor: 1.25, z: 40, order: 60 },
  fx: { factor: 1.0, z: 60, order: 70 },
} as const;

export type LayerId = keyof typeof layers;

export const world = {
  /** The camera always shows this many world units vertically. */
  viewHeight: 540,
  /** Visible body height of a standard character. */
  characterHeight: 96,
} as const;
