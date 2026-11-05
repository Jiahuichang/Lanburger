/**
 * Chibi human painter shared by every human NPC (ART_DIRECTION §1.4, §6).
 * A character is a small data "spec" — hair, skin, outfit, accessories — so friend NPCs can be added
 * from a character card without new drawing code. Proportions: ~2.2 heads tall, big head, compact body.
 *
 * Sprite sheet: 32×48 frames, 4 columns. Rows:
 *   0 idle-down  1 idle-up  2 idle-right  3 walk-down  4 walk-up  5 walk-right  6 talk-down
 * Portraits: 64×64, one per expression.
 */
import { PixelCanvas } from '../pixel';
import { palette, ramps, type Ramp } from '../tokens';
import type { Expression } from '../../character/types';

export const CHIBI_FRAME = { w: 32, h: 48, cols: 4, rows: 7 } as const;

export interface ChibiSpec {
  skin: Ramp;
  hair: Ramp;
  hairStyle: 'bun' | 'short' | 'long' | 'bob';
  outfit: Ramp;
  outfitStyle: 'coat' | 'hoodie' | 'apron';
  /** Second outfit color (collar, apron, hood lining). */
  trim: Ramp;
  legs: Ramp;
  shoes: Ramp;
  glasses?: boolean;
  /** Gold sash and medal (the mayor). */
  sash?: boolean;
}

type Dir = 'down' | 'up' | 'right';
interface Pose {
  dir: Dir;
  bob?: number;
  step?: number;
  talk?: boolean;
}

export function paintChibiSheet(spec: ChibiSpec): HTMLCanvasElement {
  const { w, h, cols, rows } = CHIBI_FRAME;
  const sheet = new PixelCanvas(w * cols, h * rows);
  const put = (row: number, col: number, p: Pose) => sheet.blit(frame(spec, p), col * w, row * h);
  (['down', 'up', 'right'] as Dir[]).forEach((dir, i) => {
    put(i, 0, { dir });
    put(i, 1, { dir, bob: 1 });
    for (let s = 0; s < 4; s++) put(3 + i, s, { dir, step: s, bob: s % 2 });
  });
  put(6, 0, { dir: 'down', talk: true });
  put(6, 1, { dir: 'down', bob: 1 });
  return sheet.toCanvas();
}

function frame(sp: ChibiSpec, p: Pose): PixelCanvas {
  const c = new PixelCanvas(CHIBI_FRAME.w, CHIBI_FRAME.h);
  const b = p.bob ?? 0;
  const step = p.step ?? -1;
  const side = p.dir === 'right';
  const back = p.dir === 'up';

  // legs and shoes
  const legX = side ? [13, 17] : [12, 17];
  const lifts = [step === 1 ? -2 : 0, step === 3 ? -2 : 0];
  legX.forEach((lx, i) => {
    c.rect(lx, 40 + lifts[i], 3, 4, sp.legs[2]);
    c.rect(lx - (side ? 0 : 1), 43 + lifts[i], 4 + (side ? 1 : 0), 3, sp.shoes[2]);
    c.hline(lx - (side ? 0 : 1), lx + 2 + (side ? 1 : 0), 43 + lifts[i], sp.shoes[1]);
  });

  // torso
  const ty = 29 + b;
  const coatBottom = sp.outfitStyle === 'coat' ? 41 : 39;
  for (let y = ty; y <= coatBottom; y++) {
    const flare = sp.outfitStyle === 'coat' ? Math.max(0, Math.floor((y - ty - 6) / 3)) : 0;
    for (let x = 9 - flare; x <= 22 + flare; x++) {
      const l = x < 12 ? sp.outfit[0] : x > 19 ? sp.outfit[2] : sp.outfit[1];
      c.set(x, y, l);
    }
  }
  c.hline(9, 22, coatBottom, sp.outfit[2]);
  if (!back) {
    if (sp.outfitStyle === 'apron') c.rect(11, ty + 3, 10, coatBottom - ty - 3, sp.trim[0]);
    if (sp.outfitStyle === 'hoodie') c.rect(14, ty + 2, 4, 6, sp.trim[1]);
    if (sp.outfitStyle === 'coat') {
      c.vline(16, ty + 2, coatBottom, sp.outfit[2]);
      for (const y of [ty + 4, ty + 7, ty + 10]) c.set(17, y, ramps.lamp[1]);
    }
    // collar
    c.hline(12, 19, ty, sp.trim[0]);
    c.set(13, ty + 1, sp.trim[0]);
    c.set(18, ty + 1, sp.trim[0]);
    if (sp.sash && !side) {
      for (let i = 0; i < 11; i++) {
        c.set(10 + i, ty + 1 + i, ramps.lamp[2]);
        c.set(11 + i, ty + 1 + i, ramps.lamp[1]);
      }
      c.rect(12, ty + 3, 3, 3, ramps.lamp[0]);
      c.set(13, ty + 4, ramps.lamp[2]);
    }
  } else if (sp.outfitStyle === 'hoodie') {
    c.rect(12, ty, 8, 4, sp.outfit[2]);
  }

  // arms
  const swing = step === 1 ? -1 : step === 3 ? 1 : 0;
  if (side) {
    c.rect(15 + swing, ty + 2, 3, 7, sp.outfit[2]);
    c.rect(15 + swing, ty + 9, 3, 2, sp.skin[1]);
  } else {
    c.rect(7, ty + 1 + swing, 2, 7, sp.outfit[2]);
    c.rect(23, ty + 1 - swing, 2, 7, sp.outfit[2]);
    c.rect(7, ty + 8 + swing, 2, 2, sp.skin[1]);
    c.rect(23, ty + 8 - swing, 2, 2, sp.skin[1]);
  }

  // head
  const hy = 19 + b;
  c.ellipseEach(15.5, hy, 9.5, 9, (x, y, nx, ny) => c.set(x, y, nx > 0.55 || ny > 0.75 ? sp.skin[2] : sp.skin[1]));
  if (side) c.rect(9, hy, 2, 3, sp.skin[2]); // ear
  hair(c, sp, hy, p.dir);

  if (!back) face(c, sp, hy, side, !!p.talk);
  c.outline(palette.ink);
  return c;
}

function hair(c: PixelCanvas, sp: ChibiSpec, hy: number, dir: Dir): void {
  const h = sp.hair;
  const shade = (x: number, y: number, nx: number, ny: number) => c.set(x, y, -nx * 0.5 - ny * 0.6 > 0.35 ? h[0] : nx > 0.5 ? h[2] : h[1]);
  if (dir === 'up') {
    c.ellipseEach(15.5, hy - 1, 10, 9.5, shade);
    if (sp.hairStyle === 'long') c.rect(7, hy + 2, 18, 10, h[1]);
  } else {
    // cap of hair over the top of the head, with jagged bangs
    c.ellipseEach(15.5, hy - 3, 10.5, 8, (x, y, nx, ny) => {
      const bang = y < hy - 3 + ((x * 5) % 3) + (dir === 'right' && x > 18 ? -1 : 1);
      if (bang || Math.abs(nx) > 0.82) shade(x, y, nx, ny);
    });
    const sides = dir === 'right' ? [7] : [6, 24];
    const len = sp.hairStyle === 'long' ? 13 : sp.hairStyle === 'bob' ? 8 : 4;
    for (const x of sides) c.rect(x, hy - 3, 2, len, h[x > 15 ? 2 : 1]);
  }
  if (sp.hairStyle === 'bun') {
    c.shadedEllipse(15.5, hy - 10, 4.5, 4, h);
    c.hline(12, 19, hy - 7, ramps.royal[1]); // ribbon
  }
}

function face(c: PixelCanvas, sp: ChibiSpec, hy: number, side: boolean, talk: boolean): void {
  const ink = palette.ink;
  const ex = side ? [15, 21] : [10, 19];
  const ey = hy + 1;
  for (const x of ex) {
    c.rect(x, ey, 2, 3, ink);
    c.set(x, ey, ramps.wall[0]);
  }
  if (sp.glasses) {
    for (const x of ex) {
      c.hline(x - 1, x + 2, ey - 1, ink);
      c.hline(x - 1, x + 2, ey + 3, ink);
      c.vline(x - 1, ey - 1, ey + 3, ink);
      c.vline(x + 2, ey - 1, ey + 3, ink);
      c.set(x + 1, ey, ramps.lamp[0]);
    }
    if (!side) c.hline(ex[0] + 3, ex[1] - 2, ey, ink);
  }
  const bx = side ? [23] : [7, 21];
  for (const x of bx) c.hline(x, x + 2, ey + 4, ramps.blossom[1]);
  const mx = side ? 19 : 14;
  if (talk) {
    c.rect(mx, ey + 5, 3, 2, ink);
    c.set(mx + 1, ey + 6, ramps.roofRed[1]);
  } else {
    c.set(mx, ey + 5, ink);
    c.set(mx + 1, ey + 6, ink);
    c.set(mx + 2, ey + 5, ink);
  }
}

// ───────────────────────── portraits

export function paintChibiPortraits(spec: ChibiSpec, order: readonly Expression[]): HTMLCanvasElement {
  const S = 64;
  const sheet = new PixelCanvas(S * order.length, S);
  order.forEach((e, i) => sheet.blit(portrait(spec, e), i * S, 0));
  return sheet.toCanvas();
}

function portrait(sp: ChibiSpec, e: Expression): PixelCanvas {
  const c = new PixelCanvas(64, 64);
  const ink = palette.ink;
  const white = ramps.wall[0];
  const h = sp.hair;
  const lift = e === 'celebrating' ? -2 : 0;

  // shoulders and outfit
  c.ellipseEach(32, 66, 26, 14, (x, y, nx) => c.set(x, y, nx < -0.4 ? sp.outfit[0] : nx > 0.5 ? sp.outfit[2] : sp.outfit[1]));
  c.rect(27, 48 + lift, 10, 6, sp.skin[2]); // neck
  c.hline(22, 41, 53, sp.trim[0]);
  c.hline(24, 39, 54, sp.trim[0]);
  if (sp.sash) {
    for (let i = 0; i < 14; i++) {
      c.hline(16 + i * 2, 18 + i * 2, 54 + Math.floor(i * 0.7), ramps.lamp[1]);
      c.set(17 + i * 2, 55 + Math.floor(i * 0.7), ramps.lamp[2]);
    }
    c.shadedEllipse(22, 58, 3, 3, [ramps.lamp[0], ramps.lamp[1], ramps.lamp[2], ramps.lamp[3]]);
  }
  if (sp.outfitStyle === 'hoodie') c.rect(29, 54, 6, 10, sp.trim[1]);

  // hair behind the head (long styles)
  if (sp.hairStyle === 'long' || sp.hairStyle === 'bob') {
    const len = sp.hairStyle === 'long' ? 30 : 18;
    c.rect(11, 28 + lift, 42, len, h[2]);
  }
  // head
  c.ellipseEach(32, 32 + lift, 19, 18, (x, y, nx, ny) => c.set(x, y, nx > 0.6 || ny > 0.8 ? sp.skin[2] : -nx - ny > 1 ? sp.skin[0] : sp.skin[1]));
  // hair cap with bangs
  c.ellipseEach(32, 25 + lift, 21, 16, (x, y, nx, ny) => {
    const bangLine = 25 + lift + Math.round(Math.abs(Math.sin(x * 0.45)) * 3) - 1;
    if (y > bangLine && Math.abs(nx) < 0.78) return;
    if (y > 25 + lift + 12) return;
    c.set(x, y, -nx * 0.5 - ny * 0.6 > 0.35 ? h[0] : nx > 0.45 ? h[2] : h[1]);
  });
  if (sp.hairStyle === 'bun') {
    c.shadedEllipse(32, 6 + lift, 8, 7, h);
    c.hline(25, 39, 12 + lift, ramps.royal[1]);
    c.hline(26, 38, 13 + lift, ramps.royal[2]);
  }
  // highlight streak
  for (let i = 0; i < 6; i++) c.set(20 + i, 15 + lift + (i % 3 === 0 ? 1 : 0), h[0]);

  // face
  const ey = 33 + lift;
  const eyes = [22, 38];
  const openEye = (x: number, hgt = 6, look = 0) => {
    c.rect(x, ey, 4, hgt, ink);
    c.rect(x + 1 + look, ey + 1, 2, 2, white);
  };
  const smileEye = (x: number) => {
    c.set(x - 1, ey + 3, ink);
    c.hline(x, x + 3, ey + 2, ink);
    c.set(x + 4, ey + 3, ink);
  };
  const brow = (x: number, dy: number, slope: number) => {
    for (let i = 0; i < 6; i++) c.set(x - 1 + i, ey - 4 + dy + Math.round(slope * (i - 2.5)), h[3]);
  };
  switch (e) {
    case 'neutral':
      eyes.forEach((x) => openEye(x));
      eyes.forEach((x) => brow(x, 0, 0));
      break;
    case 'happy':
    case 'celebrating':
      eyes.forEach(smileEye);
      eyes.forEach((x) => brow(x, -1, 0));
      break;
    case 'surprised':
      eyes.forEach((x) => openEye(x, 7));
      eyes.forEach((x) => brow(x, -3, 0));
      break;
    case 'thinking':
      eyes.forEach((x) => openEye(x, 6, 1));
      brow(eyes[0], 0, 0);
      brow(eyes[1], -2, -0.3);
      break;
    case 'worried':
      eyes.forEach((x) => openEye(x, 5));
      brow(eyes[0], 0, -0.45);
      brow(eyes[1], 0, 0.45);
      break;
  }
  if (sp.glasses) {
    for (const x of eyes) {
      c.hline(x - 3, x + 6, ey - 2, ink);
      c.hline(x - 3, x + 6, ey + 8, ink);
      c.vline(x - 3, ey - 2, ey + 8, ink);
      c.vline(x + 6, ey - 2, ey + 8, ink);
      c.set(x + 5, ey - 1, ramps.lamp[0]);
      c.set(x + 4, ey - 1, ramps.lamp[0]);
    }
    c.hline(eyes[0] + 7, eyes[1] - 4, ey + 1, ink);
  }
  for (const x of [17, 42]) {
    c.rect(x, ey + 9, 5, 2, ramps.blossom[1]);
    c.hline(x + 1, x + 3, ey + 9, ramps.blossom[0]);
  }
  const my = ey + 12;
  switch (e) {
    case 'neutral':
      c.hline(30, 33, my, ink);
      break;
    case 'happy':
      c.rect(29, my - 1, 6, 3, ink);
      c.rect(30, my, 4, 1, ramps.roofRed[1]);
      break;
    case 'celebrating':
      c.rect(28, my - 1, 8, 5, ink);
      c.rect(29, my, 6, 3, ramps.roofRed[1]);
      for (const [x, y] of [[6, 10], [57, 8], [58, 34], [5, 38]] as const) {
        c.set(x, y, ramps.lamp[0]);
        c.set(x - 1, y, ramps.lamp[1]);
        c.set(x + 1, y, ramps.lamp[1]);
        c.set(x, y - 1, ramps.lamp[1]);
        c.set(x, y + 1, ramps.lamp[1]);
      }
      break;
    case 'surprised':
      c.ellipse(32, my + 1, 2, 2.5, ink);
      break;
    case 'thinking':
      c.hline(30, 34, my, ink);
      c.set(35, my - 1, ink);
      c.shadedEllipse(43, my + 6, 4, 3, sp.skin);
      break;
    case 'worried':
      for (let i = 0; i < 6; i++) c.set(29 + i, my + (i % 2), ink);
      c.ellipse(52, 22 + lift, 2, 3, ramps.water[0]);
      break;
  }
  c.outline(ink);
  return c;
}
