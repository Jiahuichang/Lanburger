/**
 * Lanburger, the burger hero (ART_DIRECTION §5-A), painted at native resolution from palette ramps.
 *
 * Sprite sheet: 32×48 frames, 4 columns. Rows:
 *   0 idle-down  1 idle-up  2 idle-right  3 walk-down  4 walk-up  5 walk-right
 *   6 talk-down  7 celebrate  8 incorrect  9 learn
 * Growth (PROGRESSION_SYSTEM §5): stage changes the body; toppings are paper-doll layers on the same grid.
 * Portraits: 64×64, one per expression (neutral, happy, surprised, thinking, worried, celebrating).
 */
import { PixelCanvas } from '../pixel';
import { palette, ramps } from '../tokens';
import type { Expression } from '../../character/types';

export const HERO_FRAME = { w: 32, h: 48, cols: 4, rows: 10 } as const;
export const PORTRAIT_SIZE = 64;

export type BurgerStage = 'slider' | 'classic' | 'double' | 'deluxe';
export const TOPPINGS = ['cheese', 'tomato', 'pickle', 'onion', 'lettuce'] as const;
export type Topping = (typeof TOPPINGS)[number];

type Dir = 'down' | 'up' | 'right';
type Face = 'normal' | 'happy' | 'oops' | 'talk' | 'focus';

interface Pose {
  dir: Dir;
  bob?: number;
  hop?: number;
  /** Walk cycle 0..3, -1 standing. */
  step?: number;
  arms?: 'down' | 'up' | 'book';
  face?: Face;
  sweat?: boolean;
}

/** Body measurements for a growth stage. */
function body(stage: BurgerStage) {
  const big = stage !== 'slider';
  const double = stage === 'double' || stage === 'deluxe';
  return {
    rx: big ? 13 : 12,
    domeRy: big ? 10 : 9,
    /** Extra height added by a second patty. */
    lift: double ? 4 : 0,
    double,
    hat: stage === 'deluxe',
  };
}

// ───────────────────────── sprite sheet

/** Paint the base sheet, or one topping layer, for a stage. Layers line up with the base frame by frame. */
export function paintHeroSheet(stage: BurgerStage = 'slider', layer: 'base' | Topping = 'base'): HTMLCanvasElement {
  const { w, h, cols, rows } = HERO_FRAME;
  const sheet = new PixelCanvas(w * cols, h * rows);
  const put = (row: number, col: number, pose: Pose) => {
    const base = frame(pose, stage);
    if (layer === 'base') sheet.blit(base, col * w, row * h);
    else sheet.blit(toppingFrame(pose, stage, layer, base), col * w, row * h);
  };
  const dirs: Dir[] = ['down', 'up', 'right'];
  dirs.forEach((dir, i) => {
    put(i, 0, { dir, bob: 0 });
    put(i, 1, { dir, bob: 1 });
    for (let s = 0; s < 4; s++) put(3 + i, s, { dir, step: s, bob: s % 2 });
  });
  put(6, 0, { dir: 'down', face: 'talk' });
  put(6, 1, { dir: 'down', face: 'normal', bob: 1 });
  [0, 3, 5, 2].forEach((hop, f) => put(7, f, { dir: 'down', hop, arms: f > 0 ? 'up' : 'down', face: 'happy' }));
  [0, 1, 1, 0].forEach((bob, f) => put(8, f, { dir: 'down', bob, face: f === 0 ? 'normal' : 'oops', sweat: f > 0 }));
  put(9, 0, { dir: 'down', arms: 'book', face: 'focus' });
  put(9, 1, { dir: 'down', arms: 'book', face: 'focus', bob: 1 });
  return sheet.toCanvas();
}

/** Seam between patty and top bun, where toppings sit. */
const seamY = (stage: BurgerStage, b: number) => 31 + b - body(stage).lift;

function frame(p: Pose, stage: BurgerStage): PixelCanvas {
  const c = new PixelCanvas(HERO_FRAME.w, HERO_FRAME.h);
  const B = body(stage);
  const up = p.hop ?? 0;
  const b = (p.bob ?? 0) - up;
  const bun = ramps.bunOrange;
  const step = p.step ?? -1;
  const side = p.dir === 'right';

  // legs and sneakers
  const legX = side ? [12, 17] : [11, 18];
  const lifts = [step === 1 ? -2 : 0, step === 3 ? -2 : 0];
  legX.forEach((lx, i) => {
    const y = 39 - up + lifts[i];
    c.rect(lx, y, 3, 5, ramps.patty[3]);
    const sx = lx - 1 + (side ? 1 : 0);
    c.rect(sx, y + 4, 5, 3, ramps.roofRed[1]);
    c.hline(sx, sx + 4, y + 6, ramps.wall[0]);
    c.set(sx + 1, y + 4, ramps.roofRed[0]);
  });

  // bottom bun
  c.ellipseEach(16, 38 + b, B.rx - 1, 3.5, (x, y, nx, ny) => c.set(x, y, ny < -0.3 && nx < 0.4 ? bun[1] : ny > 0.5 ? bun[3] : bun[2]));
  // patties
  const patty = (cy: number) =>
    c.ellipseEach(16, cy, B.rx + 0.5, 2.6, (x, y, nx, ny) => {
      const speck = (x * 7 + y * 3) % 9 === 0;
      c.set(x, y, ny > 0.4 ? ramps.patty[2] : nx < -0.4 ? ramps.patty[0] : speck ? ramps.patty[2] : ramps.patty[1]);
    });
  patty(34 + b);
  if (B.double) {
    c.hline(5, 27, 32 + b, ramps.lamp[1]); // cheese between the patties
    patty(30 + b);
  }
  // top bun dome
  const seam = seamY(stage, b);
  const domeCy = seam - 7;
  c.ellipseEach(16, domeCy, B.rx + 1, B.domeRy, (x, y, nx, ny) => {
    if (y > seam) return;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = -nx * 0.45 - ny * 0.65 + nz * 0.5;
    c.set(x, y, l > 0.66 ? bun[0] : l > 0.02 ? bun[1] : bun[2]);
  });
  c.hline(4, 28, seam, bun[2]);
  // glossy highlight arc
  for (let i = 0; i < 5; i++) c.set(9 + i, domeCy - B.domeRy + 3 + (i === 0 || i === 4 ? 1 : 0), ramps.wall[0]);
  // sesame seeds
  const seeds: [number, number][] =
    p.dir === 'up' ? [[10, -5], [15, -8], [20, -6], [13, -1], [19, 0], [24, -3], [8, 0]] : [[12, -7], [17, -9], [21, -6], [8, -4], [24, -2]];
  for (const [x, dy] of seeds) {
    const sx = side ? x - 2 : x;
    c.set(sx, domeCy + dy, ramps.wall[0]);
    c.set(sx, domeCy + dy + 1, ramps.wall[2]);
  }
  if (B.hat) chefHat(c, 16, domeCy - B.domeRy - 1);

  // arms (round mitts)
  const mitt = (x: number, y: number) => {
    c.rect(x, y, 3, 3, bun[1]);
    c.set(x, y, bun[0]);
  };
  const swing = step === 1 ? -1 : step === 3 ? 1 : 0;
  if (p.arms === 'up') {
    mitt(1, seam - 10);
    mitt(28, seam - 10);
  } else if (p.arms === 'book') {
    c.rect(11, seam + 2, 10, 7, ramps.royal[1]);
    c.rect(12, seam + 3, 8, 5, ramps.wall[0]);
    c.vline(16, seam + 3, seam + 7, ramps.royal[2]);
    mitt(9, seam + 4);
    mitt(20, seam + 4);
  } else if (side) {
    mitt(15 + swing, seam + 6);
  } else {
    // hands hang beside the bottom bun, clear of the patty
    mitt(1, seam + 5 + swing);
    mitt(28, seam + 5 - swing);
  }

  if (p.dir !== 'up') face(c, p, domeCy + 1);
  if (p.sweat) {
    c.set(27, domeCy - 6, ramps.water[0]);
    c.rect(26, domeCy - 5, 3, 2, ramps.water[0]);
    c.set(27, domeCy - 3, ramps.water[1]);
  }
  c.outline(palette.ink);
  return c;
}

function face(c: PixelCanvas, p: Pose, ey: number): void {
  const ink = palette.ink;
  const white = ramps.wall[0];
  const side = p.dir === 'right';
  const ex = side ? [17, 23] : [10, 20];
  const mx = side ? 21 : 15;
  const f = p.face ?? 'normal';
  for (const x of ex) {
    if (f === 'oops') {
      c.hline(x, x + 1, ey + 1, ink);
      c.set(x + (x === ex[0] ? 1 : 0), ey - 1, ink); // worried brows
    } else if (f === 'happy') {
      c.set(x, ey + 1, ink);
      c.set(x + 1, ey, ink);
      c.set(x + 2, ey + 1, ink);
    } else {
      c.rect(x, ey - 1, 2, 4, ink);
      c.set(x, ey - 1, white);
      if (f === 'focus') c.set(x + 1, ey + 2, white);
    }
  }
  const bx = side ? [26] : [6, 23];
  for (const x of bx) {
    c.hline(x, x + 2, ey + 4, ramps.blossom[1]);
    c.set(x + 1, ey + 4, ramps.blossom[0]);
  }
  if (f === 'happy' || f === 'talk') {
    c.hline(mx, mx + 2, ey + 4, ink);
    c.set(mx + 1, ey + 5, ramps.roofRed[1]);
    if (f === 'happy') c.set(mx + 1, ey + 6, ink);
  } else if (f === 'oops') {
    c.set(mx, ey + 5, ink);
    c.set(mx + 1, ey + 4, ink);
    c.set(mx + 2, ey + 5, ink);
  } else {
    c.set(mx, ey + 4, ink);
    c.set(mx + 1, ey + 5, ink);
    c.set(mx + 2, ey + 4, ink);
  }
}

function chefHat(c: PixelCanvas, cx: number, top: number): void {
  const w = ramps.wall;
  c.shadedEllipse(cx - 4, top - 5, 4, 4, w);
  c.shadedEllipse(cx + 4, top - 5, 4, 4, w);
  c.shadedEllipse(cx, top - 7, 5, 4, w);
  c.rect(cx - 6, top - 3, 13, 4, w[1]);
  c.hline(cx - 6, cx + 6, top - 3, w[0]);
  c.hline(cx - 6, cx + 6, top, w[2]);
}

/** One topping layer for a pose. Only its own pixels plus outline pixels outside the body silhouette. */
function toppingFrame(p: Pose, stage: BurgerStage, t: Topping, base: PixelCanvas): PixelCanvas {
  const c = new PixelCanvas(HERO_FRAME.w, HERO_FRAME.h);
  const b = (p.bob ?? 0) - (p.hop ?? 0);
  const seam = seamY(stage, b);
  const rx = body(stage).rx;
  const L = 16 - rx - 1;
  const R = 16 + rx + 1;
  switch (t) {
    case 'lettuce':
      for (let x = L; x <= R; x++) {
        const wave = (x + (p.step ?? 0)) % 4 < 2 ? 0 : 1;
        c.set(x, seam + 1, ramps.foliage[0]);
        c.set(x, seam + 2 + wave, ramps.foliage[1]);
        if (wave) c.set(x, seam + 2, ramps.foliage[0]);
      }
      break;
    case 'cheese':
      c.hline(L + 1, R - 1, seam + 2, ramps.lamp[1]);
      for (const x of [L + 3, 16, R - 4]) c.rect(x, seam + 3, 2, x === 16 ? 3 : 2, ramps.lamp[1]);
      c.hline(L + 1, R - 1, seam + 1, ramps.lamp[0]);
      break;
    case 'tomato':
      c.hline(L, L + 4, seam + 2, ramps.roofRed[0]);
      c.hline(R - 4, R, seam + 2, ramps.roofRed[0]);
      c.set(L + 1, seam + 1, ramps.roofRed[1]);
      c.set(R - 1, seam + 1, ramps.roofRed[1]);
      break;
    case 'pickle':
      for (const x of [L + 2, L + 7, R - 8, R - 3]) {
        c.hline(x, x + 2, seam + 2, ramps.foliage[2]);
        c.set(x + 1, seam + 2, ramps.foliage[0]);
      }
      break;
    case 'onion':
      for (const x of [L + 4, R - 6]) {
        c.hline(x, x + 3, seam + 1, ramps.wall[0]);
        c.set(x, seam + 2, ramps.wall[0]);
        c.set(x + 3, seam + 2, ramps.wall[0]);
      }
      break;
  }
  // outline only where the base frame is empty, so the body's own outline stays untouched
  const marks: number[] = [];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (c.alpha(x, y) || base.alpha(x, y)) continue;
      if (c.alpha(x - 1, y) || c.alpha(x + 1, y) || c.alpha(x, y - 1) || c.alpha(x, y + 1)) marks.push(x, y);
    }
  }
  for (let i = 0; i < marks.length; i += 2) c.set(marks[i], marks[i + 1], palette.ink);
  return c;
}

// ───────────────────────── portraits

export function paintHeroPortraits(order: readonly Expression[]): HTMLCanvasElement {
  const S = PORTRAIT_SIZE;
  const sheet = new PixelCanvas(S * order.length, S);
  order.forEach((e, i) => sheet.blit(portrait(e), i * S, 0));
  return sheet.toCanvas();
}

function portrait(e: Expression): PixelCanvas {
  const S = PORTRAIT_SIZE;
  const c = new PixelCanvas(S, S);
  const bun = ramps.bunOrange;
  const ink = palette.ink;
  const white = ramps.wall[0];
  const lift = e === 'celebrating' ? -2 : 0;

  // bun body bust: dome + patty + lettuce peeking
  const seam = 50 + lift;
  c.ellipseEach(32, 60 + lift, 26, 6, (x, y) => c.set(x, y, ramps.patty[1]));
  for (let x = 6; x <= 58; x++) c.set(x, seam + 1 + (x % 4 < 2 ? 0 : 1), ramps.foliage[1]);
  c.ellipseEach(32, 33 + lift, 27, 22, (x, y, nx, ny) => {
    if (y > seam) return;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = -nx * 0.45 - ny * 0.6 + nz * 0.5;
    c.set(x, y, l > 0.68 ? bun[0] : l > 0.0 ? bun[1] : bun[2]);
  });
  c.hline(5, 59, seam, bun[2]);
  for (let i = 0; i < 8; i++) c.set(16 + i, 15 + lift + (i === 0 || i === 7 ? 1 : 0), white);
  for (let i = 0; i < 4; i++) c.set(14 + i, 16 + lift + i, white);
  for (const [x, y] of [[26, 16], [36, 13], [44, 18], [20, 22], [48, 26], [12, 28]] as const) {
    c.rect(x, y + lift, 2, 1, white);
    c.set(x, y + 1 + lift, ramps.wall[2]);
  }

  // face
  const ey = 33 + lift;
  const eyes = [19, 40];
  const brow = (x: number, dy: number, slope: number) => {
    for (let i = 0; i < 7; i++) c.set(x - 1 + i, ey - 6 + dy + Math.round(slope * (i - 3)), ink);
  };
  const openEye = (x: number, h = 9, look = 0) => {
    c.rect(x, ey - 2, 5, h, ink);
    c.rect(x + 1, ey - 3, 3, 1, ink);
    c.rect(x + look + 1, ey - 1, 2, 3, white);
    c.set(x + 3, ey + h - 5, white);
    c.hline(x + 1, x + 3, ey + h - 3, ramps.royal[0]);
  };
  const smileEye = (x: number) => {
    c.set(x - 1, ey + 2, ink);
    c.set(x, ey + 1, ink);
    c.hline(x + 1, x + 3, ey, ink);
    c.set(x + 4, ey + 1, ink);
    c.set(x + 5, ey + 2, ink);
    c.hline(x + 1, x + 3, ey + 1, ink);
  };
  switch (e) {
    case 'neutral':
      eyes.forEach((x) => openEye(x));
      break;
    case 'happy':
    case 'celebrating':
      eyes.forEach(smileEye);
      break;
    case 'surprised':
      eyes.forEach((x) => {
        openEye(x, 10);
        brow(x, -3, 0);
      });
      break;
    case 'thinking':
      eyes.forEach((x) => openEye(x, 9, 1));
      brow(eyes[0], 1, 0);
      brow(eyes[1], -1, -0.3);
      break;
    case 'worried':
      openEye(eyes[0], 8);
      openEye(eyes[1], 8);
      brow(eyes[0], 0, -0.4);
      brow(eyes[1], 0, 0.4);
      break;
  }
  // cheeks
  for (const x of [10, 48]) {
    c.rect(x, ey + 8, 6, 2, ramps.blossom[1]);
    c.hline(x + 1, x + 4, ey + 8, ramps.blossom[0]);
  }
  // mouth
  const my = ey + 10;
  switch (e) {
    case 'neutral':
      c.hline(30, 33, my, ink);
      c.set(29, my - 1, ink);
      c.set(34, my - 1, ink);
      break;
    case 'happy':
      c.rect(28, my - 1, 8, 4, ink);
      c.rect(29, my, 6, 2, ramps.roofRed[1]);
      c.hline(29, 34, my - 1, white);
      break;
    case 'celebrating':
      c.rect(27, my - 1, 10, 6, ink);
      c.rect(28, my, 8, 4, ramps.roofRed[1]);
      c.rect(30, my + 2, 4, 2, ramps.blossom[0]);
      break;
    case 'surprised':
      c.ellipse(32, my + 1, 2.5, 3, ink);
      c.ellipse(32, my + 1, 1.2, 1.8, ramps.roofRed[2]);
      break;
    case 'thinking':
      c.hline(30, 35, my, ink);
      c.set(36, my - 1, ink);
      break;
    case 'worried':
      for (let i = 0; i < 7; i++) c.set(29 + i, my + (i % 2), ink);
      break;
  }

  // extras
  if (e === 'worried') {
    c.ellipse(52, 18, 2, 3, ramps.water[0]);
    c.set(52, 14, ramps.water[0]);
  }
  if (e === 'thinking') {
    // mitt on chin
    c.shadedEllipse(44, my + 4, 4, 3, bun);
  }
  if (e === 'celebrating') {
    for (const [x, y] of [[6, 8], [56, 6], [58, 30], [4, 34]] as const) sparkle(c, x, y);
  }
  if (e === 'surprised') {
    for (const [x, y] of [[10, 6], [54, 6]] as const) {
      c.vline(x, y, y + 3, ink);
      c.set(x, y + 5, ink);
    }
  }
  c.outline(ink);
  return c;
}

function sparkle(c: PixelCanvas, x: number, y: number): void {
  c.set(x, y, ramps.lamp[0]);
  c.set(x - 1, y, ramps.lamp[1]);
  c.set(x + 1, y, ramps.lamp[1]);
  c.set(x, y - 1, ramps.lamp[1]);
  c.set(x, y + 1, ramps.lamp[1]);
}
