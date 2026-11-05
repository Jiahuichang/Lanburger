/**
 * ART DIRECTION IN CODE — the single source of truth for every color, radius, font and pixel metric.
 * See docs/ART_DIRECTION.md §4 and §9. Never hard-code visual values elsewhere; import them from here.
 *
 * Ramps go light → dark: [0] highlight, [1] base, [2] shade, [3] deep shade.
 * Sampled from references/lanburger-town.png (dusk village, mid brightness, rich midtones).
 */

export type Ramp = readonly [string, string, string, string];

export const ramps = {
  stone: ['#efc0a2', '#d39a7a', '#9c6a55', '#5a3c34'],
  plaza: ['#f2c9ad', '#dfa98a', '#b07a62', '#6e4a3e'],
  foliage: ['#a9b44c', '#5f8a3e', '#2f5a3c', '#1d3330'],
  grass: ['#8fae4a', '#5d8a3f', '#3f6a38', '#27452e'],
  blossom: ['#f8b4c6', '#e57fa3', '#b34f7c', '#6a2c50'],
  roofRed: ['#c4585a', '#a8464c', '#722f3e', '#3d1b29'],
  bunOrange: ['#f8c27a', '#f18f30', '#c06420', '#7a3a16'],
  wood: ['#c98a5e', '#955f48', '#623d36', '#2f1a19'],
  wall: ['#f2e3c4', '#d9c29a', '#a8906c', '#6b5a45'],
  slate: ['#c9c3c7', '#9d97a3', '#6e6a78', '#3f3d4a'],
  royal: ['#b47bcc', '#8f55ab', '#64397d', '#3a2048'],
  water: ['#bfe2f5', '#61a8df', '#3369b0', '#22386a'],
  lamp: ['#fffbe0', '#fde882', '#e49c29', '#9a5718'],
  shade: ['#4a4e66', '#313e42', '#232a36', '#141820'],
  patty: ['#a0583a', '#7a3e2a', '#55291f', '#2f1612'],
  skin: ['#fbd9bd', '#e9b48f', '#c4876a', '#8a5a48'],
  soil: ['#a07a52', '#7d5b3c', '#5a4030', '#3a2a20'],
} as const satisfies Record<string, Ramp>;

export type RampId = keyof typeof ramps;

/** Flat named colors for UI and effects. Every one becomes a CSS variable `--c-<kebab-name>`. */
export const palette = {
  ink: '#2a1a16',
  void: ramps.shade[3],
  panel: '#1c1f29',
  panelDeep: '#121315',
  panelEdge: '#e6dcad',
  title: '#e5cf5e',
  text: '#f4efe4',
  textSoft: '#b9b2a2',
  energy: '#ef5a3c',
  energyDeep: '#8a2a1e',
  xp: '#3d8ef0',
  xpDeep: '#1b4787',
  badge: '#f34248',
  correct: '#6cc04a',
  gentleWrong: '#f0a040',
  frame: ramps.wood[1],
  frameLight: ramps.wood[0],
  frameDark: ramps.wood[3],
  glow: ramps.lamp[1],
  glowWarm: ramps.lamp[2],
  /** Multiplied over the whole map: the dusk mood (ART_DIRECTION §1.2, §8). */
  duskTint: '#b4a6c2',
  white: '#ffffff',
} as const;

export type PaletteKey = keyof typeof palette;

export const radii = {
  panel: 10,
  card: 8,
  button: 12,
  pill: 999,
} as const;

export const fonts = {
  /** UI font (English). CJK fallbacks are listed for learning content shown in the same element. */
  ui: '"Fredoka", "Hiragino Sans", "Noto Sans JP", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
} as const;

export const motion = {
  uiMs: 160,
  sceneFadeMs: 320,
} as const;

/** Pixel-art metrics (ART_DIRECTION §9). */
export const pixel = {
  /** Map tile size in art pixels. */
  tile: 16,
  /** The renderer picks an integer zoom so the native view height lands near this many art pixels. */
  targetViewHeight: 360,
  /** Never show fewer art pixels than this vertically (very small screens zoom out instead). */
  minViewHeight: 280,
} as const;

/** Depth bands. Actors and props sort by their foot line: z = actorBase + footY * depthPerPixel. */
export const depth = {
  ground: -60,
  groundDetail: -59,
  shadow: -58,
  actorBase: -50,
  depthPerPixel: 0.01,
  overlay: 60,
  glow: 70,
  debug: 90,
} as const;
