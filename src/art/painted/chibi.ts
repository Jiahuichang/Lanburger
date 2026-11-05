/**
 * Chibi human painter shared by every human NPC (ART_DIRECTION §1.4, §6).
 * A character is a small data "card" — hair, skin, outfit, accessories — so new NPCs (including
 * friend NPCs) need no new drawing code. Proportions: ~2.2 heads tall, big head, compact body.
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
  hairStyle: 'bun' | 'short' | 'long' | 'bob' | 'spiky' | 'tousled';
  /** Fringe: full (default), swept to one side, center-parted curtains, or none (forehead visible). */
  bangs?: 'full' | 'side' | 'center' | 'none';
  /** Wavy / curly lengths (long and bob styles). */
  wavy?: boolean;
  outfit: Ramp;
  outfitStyle: 'coat' | 'hoodie' | 'apron' | 'tee' | 'shirt' | 'overshirt';
  /** Second outfit color (collar, apron, hood lining, the tee under an overshirt). */
  trim: Ramp;
  legs: Ramp;
  bottoms?: 'pants' | 'shorts' | 'skirt';
  /** Resting eye shape: round (default) or smiling crescents. */
  eyes?: 'round' | 'smile';
  shoes: Ramp;
  /** Two pixels taller (longer legs). */
  tall?: boolean;
  glasses?: boolean;
  /** Gold sash and medal (the mayor). */
  sash?: boolean;
  mustache?: boolean;
  /** Simple line tattoos on the arms (and lower legs with shorts). */
  tattoos?: boolean;
  prop?: 'spinTop' | 'duck' | 'tea' | 'bracelet';
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
  const L = sp.tall ? 2 : 0;
  const b = (p.bob ?? 0) - L;
  const step = p.step ?? -1;
  const side = p.dir === 'right';
  const back = p.dir === 'up';
  const shorts = sp.bottoms === 'shorts';

  // legs and shoes
  const legX = side ? [13, 17] : [12, 17];
  const lifts = [step === 1 ? -2 : 0, step === 3 ? -2 : 0];
  legX.forEach((lx, i) => {
    const top = 40 - L + lifts[i];
    const len = 4 + L;
    for (let y = top; y < top + len; y++) {
      const skinPart = (shorts && y >= top + 2) || sp.bottoms === 'skirt';
      c.hline(lx, lx + 2, y, skinPart ? sp.skin[1] : sp.legs[2]);
      if (skinPart && sp.tattoos && (y + lx) % 3 === 0) c.set(lx + 1, y, sp.skin[3]);
    }
    const sx = lx - (side ? 0 : 1);
    c.rect(sx, 43 + lifts[i], 4 + (side ? 1 : 0), 3, sp.shoes[2]);
    c.hline(sx, sx + 3 + (side ? 1 : 0), 43 + lifts[i], sp.shoes[1]);
  });

  // torso
  const ty = 29 + b;
  const bottom = sp.outfitStyle === 'coat' ? 41 - L : 39 - L + (shorts ? 1 : 0);
  for (let y = ty; y <= bottom; y++) {
    const flare = sp.outfitStyle === 'coat' ? Math.max(0, Math.floor((y - ty - 6) / 3)) : 0;
    for (let x = 9 - flare; x <= 22 + flare; x++) c.set(x, y, x < 12 ? sp.outfit[0] : x > 19 ? sp.outfit[2] : sp.outfit[1]);
  }
  c.hline(9, 22, bottom, sp.outfit[2]);
  if (shorts && !back) c.hline(11, 20, bottom + 1, sp.legs[2]);
  if (sp.bottoms === 'skirt') {
    // a flared skirt over the top of the legs
    for (let y = bottom - 2; y <= bottom + 3; y++) {
      const flare = Math.max(0, y - bottom + 1);
      c.hline(9 - flare, 22 + flare, y, y === bottom + 3 ? sp.legs[2] : (y - bottom) % 2 ? sp.legs[1] : sp.legs[0]);
    }
  }
  if (!back) {
    switch (sp.outfitStyle) {
      case 'apron':
        c.rect(11, ty + 3, 10, bottom - ty - 3, sp.trim[0]);
        break;
      case 'hoodie':
        c.rect(14, ty + 2, 4, 6, sp.trim[1]);
        break;
      case 'coat':
        c.vline(16, ty + 2, bottom, sp.outfit[2]);
        for (const y of [ty + 4, ty + 7, ty + 10]) c.set(17, y, ramps.lamp[1]);
        break;
      case 'shirt':
        c.vline(16, ty + 1, bottom, sp.outfit[2]);
        for (const y of [ty + 3, ty + 6, ty + 9]) c.set(15, y, sp.trim[0]);
        break;
      case 'overshirt':
        // open shirt over a tee
        c.rect(12, ty, 8, bottom - ty + 1, sp.trim[1]);
        c.vline(12, ty, bottom, sp.trim[2]);
        c.hline(12, 19, ty, sp.trim[0]);
        break;
      case 'tee':
        break;
    }
    // collar
    if (sp.outfitStyle !== 'overshirt') {
      c.hline(12, 19, ty, sp.outfitStyle === 'tee' ? sp.outfit[2] : sp.trim[0]);
      if (sp.outfitStyle !== 'tee') {
        c.set(13, ty + 1, sp.trim[0]);
        c.set(18, ty + 1, sp.trim[0]);
      }
    }
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

  // arms: short sleeves show skin (and tattoos)
  const swing = step === 1 ? -1 : step === 3 ? 1 : 0;
  const shortSleeve = sp.outfitStyle === 'tee';
  const arm = (x: number, y: number, w: number) => {
    for (let j = 0; j < 7; j++) {
      const bare = shortSleeve && j >= 3;
      c.hline(x, x + w - 1, y + j, bare ? sp.skin[1] : sp.outfit[2]);
      if (bare && sp.tattoos && j % 2 === 0) c.set(x, y + j, sp.skin[3]);
    }
    if (sp.tattoos && !shortSleeve) c.set(x, y + 6, sp.skin[3]);
    c.hline(x, x + w - 1, y + 7, sp.skin[1]);
    c.hline(x, x + w - 1, y + 8, sp.skin[1]);
  };
  if (side) arm(15 + swing, ty + 2, 3);
  else {
    arm(7, ty + 1 + swing, 2);
    arm(23, ty + 1 - swing, 2);
  }

  // props
  if (!back) prop(c, sp, ty, bottom, side, swing);

  // head
  const hy = 19 + b;
  c.ellipseEach(15.5, hy, 9.5, 9, (x, y, nx, ny) => c.set(x, y, nx > 0.55 || ny > 0.75 ? sp.skin[2] : sp.skin[1]));
  if (side) c.rect(9, hy, 2, 3, sp.skin[2]); // ear
  hair(c, sp, hy, p.dir);

  if (!back) face(c, sp, hy, side, !!p.talk);
  c.outline(palette.ink);
  return c;
}

function prop(c: PixelCanvas, sp: ChibiSpec, ty: number, bottom: number, side: boolean, swing: number): void {
  switch (sp.prop) {
    case 'spinTop': {
      // a little battle top hanging at the hip
      const x = side ? 18 : 21;
      const y = bottom - 3;
      c.hline(x, x + 3, y, ramps.royal[0]);
      c.hline(x, x + 3, y + 1, ramps.royal[2]);
      c.set(x + 1, y + 2, ramps.slate[1]);
      c.set(x + 2, y + 2, ramps.slate[1]);
      c.vline(x + 1, y - 2, y - 1, ramps.slate[2]);
      break;
    }
    case 'duck': {
      // original yellow duck keychain at the hip
      const x = side ? 18 : 8;
      const y = bottom - 2;
      c.rect(x, y, 4, 2, ramps.lamp[1]);
      c.rect(x + 2, y - 2, 2, 2, ramps.lamp[1]);
      c.set(x + 4, y - 1, ramps.bunOrange[1]);
      c.set(x + 3, y - 2, palette.ink);
      break;
    }
    case 'tea': {
      const x = side ? 18 + swing : 24;
      const y = ty + 7 - (side ? 0 : swing);
      c.rect(x, y, 3, 3, ramps.wall[0]);
      c.set(x + 3, y + 1, ramps.wall[1]);
      c.hline(x, x + 2, y, ramps.patty[0]);
      break;
    }
    case 'bracelet':
      if (!side) c.hline(7, 8, ty + 7 + swing, ramps.wood[3]);
      break;
  }
}

function hair(c: PixelCanvas, sp: ChibiSpec, hy: number, dir: Dir): void {
  const h = sp.hair;
  const shade = (x: number, y: number, nx: number, ny: number) => c.set(x, y, -nx * 0.5 - ny * 0.6 > 0.35 ? h[0] : nx > 0.5 ? h[2] : h[1]);
  const long = sp.hairStyle === 'long' || sp.hairStyle === 'bob';
  const len = sp.hairStyle === 'long' ? 14 : sp.hairStyle === 'bob' ? 8 : 4;
  const bangs = sp.bangs ?? 'full';

  if (dir === 'up') {
    c.ellipseEach(15.5, hy - 1, 10, 9.5, shade);
    if (long) {
      for (let y = hy + 2; y < hy + 2 + len - 2; y++) {
        const wob = sp.wavy ? (y >> 1) % 2 : 0;
        c.hline(7 - wob, 24 + wob, y, y % 4 === 0 ? h[2] : h[1]);
      }
    }
  } else {
    c.ellipseEach(15.5, hy - 3, 10.5, 8, (x, y, nx, ny) => {
      let line: number;
      if (bangs === 'none') line = hy - 6 + (Math.abs(x - 15.5) > 6 ? 3 : 0);
      else if (bangs === 'side') line = hy - 5 + Math.round((x - 7) * 0.35);
      else if (bangs === 'center') line = hy - 7 + Math.round(Math.abs(x - 15.5) * 0.6);
      else line = hy - 3 + ((x * 5) % 3) + (dir === 'right' && x > 18 ? -1 : 1);
      if (y < line || Math.abs(nx) > 0.82) shade(x, y, nx, ny);
    });
    if (bangs === 'center' && dir === 'down') c.vline(15, hy - 11, hy - 7, h[3]);
    const sides = dir === 'right' ? [7] : [6, 24];
    for (const x of sides) {
      for (let j = 0; j < len; j++) {
        const wob = sp.wavy && long ? ((j >> 1) % 2) * (x > 15 ? 1 : -1) : 0;
        c.hline(x + wob, x + 1 + wob, hy - 3 + j, h[x > 15 ? 2 : 1]);
      }
    }
  }
  if (sp.hairStyle === 'spiky') {
    for (const [x, hgt] of [[9, 2], [12, 3], [15, 4], [18, 3], [21, 2]] as const) {
      for (let k = 0; k < hgt; k++) c.set(x + (k % 2), hy - 11 - k, k === hgt - 1 ? h[0] : h[1]);
    }
  }
  if (sp.hairStyle === 'tousled') {
    for (const [x, dy] of [[10, -11], [14, -12], [17, -12], [21, -10]] as const) {
      c.set(x, hy + dy, h[0]);
      c.set(x + 1, hy + dy, h[1]);
    }
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
    if (sp.eyes === 'smile') {
      c.set(x - 1, ey + 2, ink);
      c.hline(x, x + 1, ey + 1, ink);
      c.set(x + 2, ey + 2, ink);
    } else {
      c.rect(x, ey, 2, 3, ink);
      c.set(x, ey, ramps.wall[0]);
    }
  }
  if (sp.glasses) {
    for (const x of side ? [ex[1]] : ex) {
      c.hline(x - 1, x + 2, ey - 1, ink);
      c.hline(x - 1, x + 2, ey + 3, ink);
      c.vline(x - 1, ey - 1, ey + 3, ink);
      c.vline(x + 2, ey - 1, ey + 3, ink);
      c.set(x + 1, ey, ramps.lamp[0]);
    }
    if (!side) c.hline(ex[0] + 3, ex[1] - 2, ey, ink);
  }
  if (side) c.hline(22, 23, ey + 4, ramps.blossom[1]);
  else for (const x of [7, 21]) c.hline(x, x + 2, ey + 4, ramps.blossom[1]);
  const mx = side ? 19 : 14;
  if (sp.mustache) c.hline(mx - 1, mx + 3, ey + 4, sp.hair[2]);
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
  const long = sp.hairStyle === 'long' || sp.hairStyle === 'bob';

  // hair behind the head (long styles)
  if (long) {
    const len = sp.hairStyle === 'long' ? 34 : 18;
    for (let y = 26 + lift; y < 26 + lift + len; y++) {
      const wob = sp.wavy ? Math.round(Math.sin(y * 0.5) * 2) : 0;
      c.hline(10 + wob, 53 - wob, y, y % 5 === 0 ? h[3] : h[2]);
    }
  }
  // shoulders and outfit
  const shirt = sp.outfit;
  c.ellipseEach(32, 66, 26, 14, (x, y, nx) => c.set(x, y, nx < -0.4 ? shirt[0] : nx > 0.5 ? shirt[2] : shirt[1]));
  if (sp.outfitStyle === 'tee') {
    // bare upper arms at the shoulder edges
    c.ellipseEach(8, 62, 4, 6, (x, y) => c.set(x, y, sp.skin[1]));
    c.ellipseEach(56, 62, 4, 6, (x, y) => c.set(x, y, sp.skin[2]));
    if (sp.tattoos) for (const [x, y] of [[7, 60], [8, 62], [56, 61]] as const) c.set(x, y, sp.skin[3]);
  }
  c.rect(27, 48 + lift, 10, 6, sp.skin[2]); // neck
  if (sp.outfitStyle === 'overshirt') c.rect(25, 53, 14, 11, sp.trim[1]);
  if (sp.outfitStyle === 'shirt') {
    c.vline(32, 54, 63, shirt[2]);
    for (const y of [57, 61]) c.set(31, y, sp.trim[0]);
  }
  if (sp.outfitStyle === 'tee') c.hline(25, 38, 53, shirt[2]);
  else {
    c.hline(22, 41, 53, sp.trim[0]);
    c.hline(24, 39, 54, sp.trim[0]);
  }
  if (sp.sash) {
    for (let i = 0; i < 14; i++) {
      c.hline(16 + i * 2, 18 + i * 2, 54 + Math.floor(i * 0.7), ramps.lamp[1]);
      c.set(17 + i * 2, 55 + Math.floor(i * 0.7), ramps.lamp[2]);
    }
    c.shadedEllipse(22, 58, 3, 3, ramps.lamp);
  }
  if (sp.outfitStyle === 'hoodie') c.rect(29, 54, 6, 10, sp.trim[1]);

  // head
  c.ellipseEach(32, 32 + lift, 19, 18, (x, y, nx, ny) => c.set(x, y, nx > 0.6 || ny > 0.8 ? sp.skin[2] : -nx - ny > 1 ? sp.skin[0] : sp.skin[1]));
  // hair cap with fringe
  const bangs = sp.bangs ?? 'full';
  c.ellipseEach(32, 25 + lift, 21, 16, (x, y, nx, ny) => {
    let line: number;
    if (bangs === 'none') line = 18 + lift + (Math.abs(x - 32) > 13 ? 8 : Math.abs(x - 32) > 9 ? 3 : 0);
    else if (bangs === 'side') line = 18 + lift + Math.round((x - 12) * 0.32);
    else if (bangs === 'center') line = 14 + lift + Math.round(Math.abs(x - 32) * 0.62);
    else line = 25 + lift + Math.round(Math.abs(Math.sin(x * 0.45)) * 3) - 1;
    if (y > line && Math.abs(nx) < 0.78) return;
    if (y > 25 + lift + 12) return;
    c.set(x, y, -nx * 0.5 - ny * 0.6 > 0.35 ? h[0] : nx > 0.45 ? h[2] : h[1]);
  });
  if (sp.hairStyle === 'spiky') {
    for (const [x, hgt] of [[16, 4], [22, 6], [29, 7], [36, 6], [43, 5], [48, 3]] as const) {
      for (let k = 0; k < hgt; k++) c.hline(x - Math.floor((hgt - k) / 2), x + Math.floor((hgt - k) / 2), 10 + lift - k, k > hgt - 2 ? h[0] : h[1]);
    }
  }
  if (sp.hairStyle === 'tousled') {
    for (const [x, y] of [[18, 10], [26, 8], [34, 8], [42, 10], [47, 13]] as const) c.shadedEllipse(x, y + lift, 4, 3, h);
  }
  if (sp.hairStyle === 'bun') {
    c.shadedEllipse(32, 6 + lift, 8, 7, h);
    c.hline(25, 39, 12 + lift, ramps.royal[1]);
    c.hline(26, 38, 13 + lift, ramps.royal[2]);
  }
  for (let i = 0; i < 6; i++) c.set(20 + i, 15 + lift + (i % 3 === 0 ? 1 : 0), h[0]);
  if (bangs === 'center') c.vline(32, 9 + lift, 14 + lift, h[3]);

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
      if (sp.eyes === 'smile') eyes.forEach(smileEye);
      else eyes.forEach((x) => openEye(x));
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
  if (sp.mustache) {
    c.hline(27, 37, my - 2, h[2]);
    c.hline(28, 36, my - 3, h[1]);
    c.set(26, my - 1, h[2]);
    c.set(38, my - 1, h[2]);
  }
  switch (e) {
    case 'neutral':
      if (sp.eyes === 'smile') {
        c.set(29, my - 1, ink);
        c.hline(30, 33, my, ink);
        c.set(34, my - 1, ink);
      } else c.hline(30, 33, my, ink);
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
