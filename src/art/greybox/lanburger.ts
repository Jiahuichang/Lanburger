/**
 * R1 greybox sprite sheet for Lanburger, the burger hero (ART_DIRECTION §5-A, "Slider" stage).
 * 32×48 frames. Rows:
 *   0 idle-down  1 idle-up  2 idle-right  3 walk-down  4 walk-up  5 walk-right  6 celebrate  7 incorrect
 * Final art (R2) replaces this sheet through the same manifest.
 */
import { PixelCanvas } from '../pixel';
import { palette, ramps } from '../tokens';

export const HERO_FRAME = { w: 32, h: 48, cols: 4, rows: 8 } as const;

type Dir = 'down' | 'up' | 'right';
type Face = 'normal' | 'happy' | 'oops';

interface Pose {
  dir: Dir;
  /** Body bob (px down). */
  bob?: number;
  /** Whole-sprite hop (px up). */
  hop?: number;
  /** Walk cycle 0..3 (-1 = standing). */
  step?: number;
  armsUp?: boolean;
  face?: Face;
  sweat?: boolean;
}

export function paintHeroSheet(): HTMLCanvasElement {
  const { w, h, cols, rows } = HERO_FRAME;
  const sheet = new PixelCanvas(w * cols, h * rows);
  const put = (row: number, col: number, pose: Pose) => sheet.blit(frame(pose), col * w, row * h);

  const dirs: Dir[] = ['down', 'up', 'right'];
  dirs.forEach((dir, i) => {
    put(i, 0, { dir, bob: 0 });
    put(i, 1, { dir, bob: 1 });
    for (let s = 0; s < 4; s++) put(3 + i, s, { dir, step: s, bob: s % 2 });
  });
  [0, 3, 5, 2].forEach((hop, f) => put(6, f, { dir: 'down', hop, armsUp: f > 0, face: 'happy' }));
  [0, 1, 1, 0].forEach((bob, f) => put(7, f, { dir: 'down', bob, face: f === 0 ? 'normal' : 'oops', sweat: f > 0 }));
  return sheet.toCanvas();
}

function frame(p: Pose): PixelCanvas {
  const c = new PixelCanvas(HERO_FRAME.w, HERO_FRAME.h);
  const up = p.hop ?? 0;
  const b = (p.bob ?? 0) - up;
  const bun = ramps.bunOrange;
  const step = p.step ?? -1;

  // legs and shoes
  const legs: [number, number][] = [
    [11, step === 1 ? -2 : 0],
    [18, step === 3 ? -2 : 0],
  ];
  if (p.dir === 'right') {
    legs[0][0] = 12;
    legs[1][0] = 17;
  }
  for (const [lx, lift] of legs) {
    c.rect(lx, 39 - up + lift, 3, 5, ramps.patty[3]);
    c.rect(lx - 1 + (p.dir === 'right' ? 1 : 0), 43 - up + lift, 5, 3, ramps.wood[2]);
    c.hline(lx - 1 + (p.dir === 'right' ? 1 : 0), lx + 3 + (p.dir === 'right' ? 1 : 0), 43 - up + lift, ramps.wood[1]);
  }

  // bottom bun, patty, lettuce, top bun
  c.ellipseEach(16, 38 + b, 11, 3.5, (x, y, nx, ny) => c.set(x, y, ny < -0.2 && nx < 0.3 ? bun[1] : bun[2]));
  c.ellipseEach(16, 34 + b, 12.5, 2.6, (x, y, nx) => c.set(x, y, nx < -0.3 ? ramps.patty[0] : ramps.patty[1]));
  c.ellipseEach(16, 25 + b, 13, 10, (x, y, nx, ny) => {
    if (y > 31 + b) return;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const l = -nx * 0.45 - ny * 0.6 + nz * 0.5;
    c.set(x, y, l > 0.62 ? bun[0] : l > 0.0 ? bun[1] : bun[2]);
  });
  c.hline(4, 28, 31 + b, bun[2]);

  // sesame seeds
  const seeds: [number, number][] =
    p.dir === 'up' ? [[10, 20], [15, 17], [20, 19], [13, 24], [19, 25], [24, 22], [8, 25]] : [[12, 18], [17, 16], [21, 19], [9, 21]];
  for (const [x, y] of seeds) {
    const sx = p.dir === 'right' ? x - 2 : x;
    c.set(sx, y + b, ramps.wall[0]);
  }

  // arms
  const arm = bun[2];
  if (p.armsUp) {
    c.rect(1, 22 + b, 3, 6, arm);
    c.rect(28, 22 + b, 3, 6, arm);
  } else if (p.dir === 'right') {
    c.rect(14, 33 + b, 4, 3, arm);
  } else {
    c.rect(2, 32 + b, 3, 4, arm);
    c.rect(27, 32 + b, 3, 4, arm);
  }

  if (p.dir !== 'up') face(c, p, b);
  if (p.sweat) {
    c.set(27, 15 + b, ramps.water[0]);
    c.rect(26, 16 + b, 3, 2, ramps.water[0]);
    c.set(27, 18 + b, ramps.water[1]);
  }

  c.outline(palette.ink);
  return c;
}

function face(c: PixelCanvas, p: Pose, b: number): void {
  const ink = palette.ink;
  const white = ramps.wall[0];
  const blush = ramps.blossom[1];
  const ex = p.dir === 'right' ? [17, 24] : [10, 20];
  const mx = p.dir === 'right' ? 21 : 15;
  const ey = 24 + b;
  const f = p.face ?? 'normal';

  for (const x of ex) {
    if (f === 'oops') {
      c.hline(x, x + 1, ey + 1, ink);
    } else if (f === 'happy') {
      c.set(x, ey + 1, ink);
      c.set(x + 1, ey, ink);
      c.set(x + 2, ey + 1, ink);
    } else {
      c.rect(x, ey, 2, 3, ink);
      c.set(x, ey, white);
    }
  }
  const bx = p.dir === 'right' ? [27] : [7, 23];
  for (const x of bx) c.hline(x, x + 1, ey + 4, blush);

  if (f === 'happy') {
    c.hline(mx, mx + 2, ey + 5, ink);
    c.set(mx + 1, ey + 6, ramps.roofRed[1]);
  } else if (f === 'oops') {
    c.set(mx, ey + 5, ink);
    c.set(mx + 1, ey + 4, ink);
    c.set(mx + 2, ey + 5, ink);
  } else {
    c.hline(mx, mx + 1, ey + 5, ink);
  }
}
