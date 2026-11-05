import { LANTERN_LIGHT } from '../../assets/proceduralArt';
import type { MapDefinition, PropPlacement } from './types';

/** Mossbrook Village — the first playable map (GAME_DESIGN §2). */
const WIDTH = 3600;

const lanterns = [640, 900, 2240, 2480, 3120];

const props: PropPlacement[] = [
  // ── far-ish village (mid layer, parallax 0.7)
  { kind: 'tree', layer: 'mid', x: 250, y: 12, seed: 3, scale: 0.9 },
  { kind: 'cottage', layer: 'mid', x: 640, y: 12, seed: 1, variant: 'sage' },
  { kind: 'bush', layer: 'mid', x: 880, y: 10, seed: 4 },
  { kind: 'tree', layer: 'mid', x: 1080, y: 12, seed: 8, scale: 0.85 },
  { kind: 'cottage', layer: 'mid', x: 1420, y: 12, seed: 2, variant: 'berry' },
  { kind: 'mushroom', layer: 'mid', x: 1720, y: 12, seed: 5 },
  { kind: 'tree', layer: 'mid', x: 2000, y: 12, seed: 11, scale: 0.95 },
  { kind: 'cottage', layer: 'mid', x: 2380, y: 12, seed: 6, variant: 'wood' },
  { kind: 'mushroom', layer: 'mid', x: 2700, y: 12, seed: 9, scale: 0.8 },
  { kind: 'cottage', layer: 'mid', x: 3020, y: 12, seed: 7, variant: 'sage' },
  { kind: 'tree', layer: 'mid', x: 3380, y: 12, seed: 14, scale: 0.9 },
  { kind: 'bush', layer: 'mid', x: 3200, y: 10, seed: 3 },

  // ── distant trees (midFar layer, parallax 0.4)
  ...[120, 560, 980, 1450, 1900, 2350, 2800, 3250].map(
    (x, i): PropPlacement => ({ kind: 'tree', layer: 'midFar', x, y: 70, seed: 20 + i, scale: 0.62 + (i % 3) * 0.06 }),
  ),

  // ── play layer: behind the player
  { kind: 'bush', layer: 'play', x: 120, seed: 1 },
  { kind: 'signpost', layer: 'play', x: 430 },
  { kind: 'flowers', layer: 'play', x: 486, seed: 0 },
  ...lanterns.map((x): PropPlacement => ({ kind: 'lantern', layer: 'play', x })),
  { kind: 'rock', layer: 'play', x: 760, seed: 2 },
  { kind: 'stump', layer: 'play', x: 1045 },
  { kind: 'crate', layer: 'play', x: 1190 },
  { kind: 'crate', layer: 'play', x: 1214, y: 54 },
  { kind: 'barrel', layer: 'play', x: 1260 },
  { kind: 'flowers', layer: 'play', x: 1330, seed: 1 },
  { kind: 'tree', layer: 'play', x: 2010, seed: 31, scale: 1.18 },
  { kind: 'bush', layer: 'play', x: 1560, seed: 3 },
  { kind: 'flowers', layer: 'play', x: 1820, seed: 2 },
  { kind: 'rock', layer: 'play', x: 2330, seed: 5 },
  { kind: 'barrel', layer: 'play', x: 2640 },
  { kind: 'flowers', layer: 'play', x: 2700, seed: 3 },
  { kind: 'bush', layer: 'play', x: 2900, seed: 5 },
  { kind: 'fence', layer: 'play', x: 3260, seed: 1 },
  { kind: 'gate', layer: 'play', x: 3470 },
  { kind: 'flowers', layer: 'play', x: 3370, seed: 0 },

  // ── foreground (parallax 1.25) — low, never covering the player's head
  ...[60, 340, 700, 1120, 1500, 1980, 2420, 2860, 3300].map(
    (x, i): PropPlacement => ({ kind: 'tuft', layer: 'foreground', x, y: -22, seed: i }),
  ),
  ...[520, 1300, 2150, 3050].map((x, i): PropPlacement => ({ kind: 'fern', layer: 'foreground', x, y: -44, seed: i, flip: i % 2 === 1 })),
  ...[880, 1760, 2620].map((x, i): PropPlacement => ({ kind: 'flowers', layer: 'foreground', x, y: -26, seed: i + 1 })),
];

export const mossbrook: MapDefinition = {
  id: 'mossbrook',
  width: WIDTH,
  spawn: { x: 260, y: 0 },
  restCameraY: 120,
  solids: [
    { x: -400, y: -800, w: WIDTH + 800, h: 800 },
    { x: 1000, y: 0, w: 90, h: 70 }, // tree stump
  ],
  platforms: [
    { x: 560, y: 120, w: 200 },
    { x: 800, y: 230, w: 170 },
    { x: 1380, y: 140, w: 240 },
    { x: 1640, y: 262, w: 180 },
    { x: 1900, y: 384, w: 210 },
    { x: 2500, y: 130, w: 220 },
    { x: 2760, y: 250, w: 180 },
  ],
  props,
  interactables: [
    { id: 'welcome-sign', x: 430, y: 0, radius: 80, promptKey: 'prompt.read', titleKey: 'sign.title', bodyKey: 'sign.body' },
    { id: 'grove-gate', x: 3470, y: 0, radius: 120, promptKey: 'prompt.look', titleKey: 'gate.title', bodyKey: 'gate.body' },
  ],
  bunting: [
    { x1: 640, x2: 900, y: 168, seed: 0 },
    { x1: 2240, x2: 2480, y: 168, seed: 2 },
  ],
  lights: lanterns.map((x) => ({ x: x + LANTERN_LIGHT.x, y: LANTERN_LIGHT.y })),
};
