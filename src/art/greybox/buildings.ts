/**
 * R1 greybox buildings for Hello Town, painted from palette ramps. 3/4 view: a front facade with a
 * sloped roof plane above it. Anchor = bottom-left corner (the building's front edge on the ground).
 */
import { PixelCanvas, rng } from '../pixel';
import { palette, ramps, type Ramp } from '../tokens';
import type { BuildingStyle } from '../../world/map/types';
import type { Painted } from './props';

type Icon = 'book' | 'burger' | 'basket' | 'flag' | 'emblem' | 'train';

interface Style {
  wall: Ramp;
  wallPattern: 'plaster' | 'brick' | 'planks' | 'stone';
  roof: Ramp;
  roofShape: 'gable' | 'dome' | 'flat';
  wallH: number;
  roofH: number;
  awning?: [string, string];
  icon: Icon;
  door: 'single' | 'double' | 'garage' | 'arch' | 'gate';
  chimney?: boolean;
}

const STYLES: Record<BuildingStyle, Style> = {
  townHall: { wall: ramps.slate, wallPattern: 'stone', roof: ramps.royal, roofShape: 'gable', wallH: 64, roofH: 52, icon: 'emblem', door: 'arch' },
  academy: {
    wall: ramps.wall, wallPattern: 'plaster', roof: ramps.roofRed, roofShape: 'gable', wallH: 56, roofH: 46,
    awning: [ramps.water[1], ramps.wall[0]], icon: 'book', door: 'double', chimney: true,
  },
  bistro: {
    wall: ramps.wood, wallPattern: 'planks', roof: ramps.bunOrange, roofShape: 'dome', wallH: 54, roofH: 50,
    awning: [ramps.roofRed[1], ramps.wall[0]], icon: 'burger', door: 'double',
  },
  store: {
    wall: ramps.stone, wallPattern: 'brick', roof: ramps.roofRed, roofShape: 'gable', wallH: 54, roofH: 42,
    awning: [ramps.bunOrange[1], ramps.wall[0]], icon: 'basket', door: 'single', chimney: true,
  },
  garage: { wall: ramps.slate, wallPattern: 'planks', roof: ramps.shade, roofShape: 'flat', wallH: 58, roofH: 22, icon: 'flag', door: 'garage' },
  station: { wall: ramps.wood, wallPattern: 'planks', roof: ramps.slate, roofShape: 'gable', wallH: 50, roofH: 34, icon: 'train', door: 'gate' },
};

export function paintBuilding(style: BuildingStyle, widthPx: number, seed = 0): Painted {
  const st = STYLES[style];
  const over = 4;
  const extra = st.chimney ? 12 : st.roofShape === 'dome' ? 14 : 4;
  const W = widthPx + over * 2;
  const H = st.wallH + st.roofH + extra;
  const c = new PixelCanvas(W, H);
  const wallTop = H - st.wallH;
  const x0 = over;
  const x1 = over + widthPx - 1;

  // ── facade
  paintWall(c, x0, wallTop, widthPx, st.wallH - 4, st);
  c.rect(x0, H - 4, widthPx, 4, ramps.slate[2]);
  c.hline(x0, x1, H - 4, ramps.slate[1]);
  c.hline(x0, x1, wallTop, st.wall[3]);
  c.hline(x0, x1, wallTop + 1, st.wall[2]);

  // windows either side of the door
  const cx = Math.floor(W / 2);
  const winY = wallTop + 14;
  const winXs = widthPx >= 180 ? [x0 + 14, x0 + 44, x1 - 57, x1 - 27] : [x0 + 12, x1 - 25];
  for (const wx of winXs) window_(c, wx, winY);

  // awning over the windows and door
  if (st.awning) awning(c, x0 + 6, x1 - 6, wallTop + 6, st.awning);

  door(c, cx, H - 4, st);

  // ── roof
  if (st.roofShape === 'gable') gableRoof(c, 0, W - 1, wallTop, st.roofH, st.roof);
  else if (st.roofShape === 'dome') domeRoof(c, x0, x1, wallTop, st.roofH, st.roof, seed);
  else flatRoof(c, 0, W - 1, wallTop, st.roofH, st.roof);

  if (st.chimney) {
    const chx = x1 - 34;
    c.shadedRect(chx, wallTop - st.roofH - 6, 10, 18, ramps.slate);
    c.rect(chx - 1, wallTop - st.roofH - 8, 12, 3, ramps.slate[2]);
  }
  if (style === 'townHall') townHallExtras(c, cx, wallTop, st);
  if (style === 'garage') checkers(c, 0, W - 1, wallTop - 4);
  signboard(c, cx, wallTop + 5, st.icon);

  c.outline(palette.ink);
  return { canvas: c.toCanvas(), anchor: { x: over, y: H } };
}

function paintWall(c: PixelCanvas, x: number, y: number, w: number, h: number, st: Style): void {
  const r = st.wall;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let col = r[1];
      switch (st.wallPattern) {
        case 'plaster':
          if ((i * 7 + j * 13) % 29 === 0) col = r[2];
          break;
        case 'brick': {
          const off = Math.floor(j / 5) % 2 ? 6 : 0;
          if (j % 5 === 4 || (i + off) % 12 === 11) col = r[2];
          else if (j % 5 === 0) col = r[0];
          break;
        }
        case 'stone': {
          const off = Math.floor(j / 8) % 2 ? 8 : 0;
          if (j % 8 === 7 || (i + off) % 16 === 15) col = r[2];
          else if (j % 8 === 0 || (i + off) % 16 === 0) col = r[0];
          break;
        }
        case 'planks':
          if (j % 6 === 5) col = r[2];
          else if (j % 6 === 0) col = r[0];
          break;
      }
      c.set(x + i, y + j, col);
    }
  }
  if (st.wallPattern === 'plaster') {
    // timber frame
    const beam = ramps.wood[2];
    for (let i = 0; i < w; i += 32) c.rect(x + i, y, 3, h, beam);
    c.rect(x + w - 3, y, 3, h, beam);
    c.rect(x, y + h - 10, w, 3, beam);
  }
  // shade under the eaves
  for (let i = 0; i < w; i++) {
    c.set(x + i, y + 2, r[2]);
    if (i % 2 === 0) c.set(x + i, y + 3, r[2]);
  }
}

function window_(c: PixelCanvas, x: number, y: number): void {
  const fr = ramps.wood;
  c.rect(x - 1, y - 1, 15, 15, fr[3]);
  c.rect(x, y, 13, 13, ramps.lamp[1]);
  c.rect(x + 2, y + 2, 4, 4, ramps.lamp[0]);
  c.rect(x + 1, y + 8, 11, 4, ramps.lamp[2]);
  c.vline(x + 6, y, y + 12, fr[2]);
  c.hline(x, x + 12, y + 6, fr[2]);
  c.rect(x - 2, y + 13, 17, 2, fr[1]);
}

function awning(c: PixelCanvas, x0: number, x1: number, y: number, [a, b]: [string, string]): void {
  for (let x = x0; x <= x1; x++) {
    const stripe = Math.floor((x - x0) / 5) % 2 === 0 ? a : b;
    for (let j = 0; j < 6; j++) c.set(x, y + j, stripe);
    // scalloped edge
    if ((x - x0) % 5 !== 0 && (x - x0) % 5 !== 4) c.set(x, y + 6, stripe);
  }
  c.hline(x0, x1, y, palette.ink);
}

function door(c: PixelCanvas, cx: number, base: number, st: Style): void {
  const w = ramps.wood;
  switch (st.door) {
    case 'garage': {
      const dw = 48;
      const dh = 34;
      c.rect(cx - dw / 2 - 2, base - dh - 2, dw + 4, dh + 2, ramps.slate[3]);
      for (let j = 0; j < dh; j++) c.hline(cx - dw / 2, cx + dw / 2 - 1, base - dh + j, j % 5 === 4 ? ramps.shade[3] : ramps.shade[1]);
      // a red kart peeking out
      c.shadedRect(cx - 12, base - 10, 24, 7, ramps.roofRed, 1);
      c.rect(cx - 10, base - 3, 5, 3, palette.ink);
      c.rect(cx + 5, base - 3, 5, 3, palette.ink);
      break;
    }
    case 'gate': {
      const dw = 34;
      const dh = 28;
      c.rect(cx - dw / 2, base - dh, dw, dh, ramps.shade[2]);
      for (let x = cx - dw / 2 + 2; x < cx + dw / 2; x += 5) c.vline(x, base - dh, base - 1, ramps.slate[1]);
      c.hline(cx - dw / 2, cx + dw / 2 - 1, base - dh + 4, ramps.slate[1]);
      break;
    }
    default: {
      const dw = st.door === 'double' ? 24 : st.door === 'arch' ? 26 : 16;
      const dh = st.door === 'arch' ? 32 : 26;
      c.rect(cx - dw / 2 - 2, base - dh - 2, dw + 4, dh + 2, w[3]);
      c.rect(cx - dw / 2, base - dh, dw, dh, w[1]);
      for (let x = cx - dw / 2 + 3; x < cx + dw / 2; x += 4) c.vline(x, base - dh + 1, base - 1, w[2]);
      if (st.door === 'double') c.vline(cx, base - dh, base - 1, w[3]);
      if (st.door === 'arch') {
        for (let i = 0; i < dw / 2 + 2; i++) {
          const top = Math.round(6 - Math.sqrt(Math.max(0, 1 - (i / (dw / 2 + 2)) ** 2)) * 6);
          for (let j = 0; j < 6 - top; j++) {
            c.clear(cx + i, base - dh - 2 + j);
            c.clear(cx - 1 - i, base - dh - 2 + j);
          }
        }
      }
      c.set(cx + dw / 2 - 4, base - dh / 2, ramps.lamp[2]);
      c.set(cx - dw / 2 + 3, base - dh / 2, ramps.lamp[2]);
      // welcome mat
      c.rect(cx - dw / 2, base, dw, 1, ramps.royal[2]);
    }
  }
}

function signboard(c: PixelCanvas, cx: number, y: number, icon: Icon): void {
  const w = ramps.wood;
  c.rect(cx - 12, y - 14, 24, 16, w[3]);
  c.rect(cx - 11, y - 13, 22, 14, w[1]);
  c.hline(cx - 11, cx + 10, y - 13, w[0]);
  drawIcon(c, cx, y - 6, icon);
}

function drawIcon(c: PixelCanvas, cx: number, cy: number, icon: Icon): void {
  const L = ramps.wall[0];
  switch (icon) {
    case 'book':
      c.rect(cx - 7, cy - 4, 6, 9, L);
      c.rect(cx + 1, cy - 4, 6, 9, L);
      c.vline(cx, cy - 4, cy + 5, ramps.roofRed[2]);
      c.hline(cx - 6, cx - 2, cy - 1, ramps.slate[2]);
      c.hline(cx + 2, cx + 6, cy - 1, ramps.slate[2]);
      c.hline(cx - 6, cx - 2, cy + 2, ramps.slate[2]);
      c.hline(cx + 2, cx + 6, cy + 2, ramps.slate[2]);
      break;
    case 'burger':
      c.ellipse(cx, cy - 1, 7, 4, ramps.bunOrange[1]);
      c.rect(cx - 7, cy + 1, 14, 2, ramps.foliage[1]);
      c.rect(cx - 7, cy + 3, 14, 2, ramps.patty[1]);
      c.rect(cx - 6, cy + 5, 12, 2, ramps.bunOrange[2]);
      c.set(cx - 2, cy - 3, L);
      c.set(cx + 2, cy - 2, L);
      break;
    case 'basket':
      c.rect(cx - 7, cy - 1, 14, 7, ramps.bunOrange[2]);
      for (let x = cx - 6; x < cx + 7; x += 3) c.vline(x, cy, cy + 5, ramps.bunOrange[0]);
      c.line(cx - 5, cy - 1, cx - 2, cy - 6, ramps.wood[3]);
      c.line(cx + 5, cy - 1, cx + 2, cy - 6, ramps.wood[3]);
      c.hline(cx - 2, cx + 2, cy - 6, ramps.wood[3]);
      c.set(cx - 3, cy - 2, ramps.roofRed[0]);
      c.set(cx + 3, cy - 2, ramps.foliage[0]);
      break;
    case 'flag':
      c.vline(cx - 6, cy - 6, cy + 6, ramps.slate[3]);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) c.set(cx - 5 + i, cy - 6 + j, (Math.floor(i / 3) + Math.floor(j / 3)) % 2 ? palette.ink : L);
      break;
    case 'emblem':
      c.ellipse(cx, cy, 7, 7, ramps.lamp[2]);
      c.ellipse(cx, cy, 5, 5, ramps.lamp[1]);
      c.rect(cx - 3, cy - 2, 6, 2, ramps.bunOrange[1]);
      c.rect(cx - 3, cy, 6, 1, ramps.patty[1]);
      c.rect(cx - 3, cy + 1, 6, 2, ramps.bunOrange[2]);
      break;
    case 'train':
      c.rect(cx - 7, cy - 4, 14, 8, ramps.royal[1]);
      c.rect(cx - 5, cy - 2, 4, 3, ramps.lamp[1]);
      c.rect(cx + 1, cy - 2, 4, 3, ramps.lamp[1]);
      c.rect(cx - 6, cy + 4, 3, 2, palette.ink);
      c.rect(cx + 3, cy + 4, 3, 2, palette.ink);
      break;
  }
}

function gableRoof(c: PixelCanvas, x0: number, x1: number, base: number, h: number, r: Ramp): void {
  const inset = Math.floor(h * 0.35);
  for (let j = 0; j < h; j++) {
    const y = base - 1 - j;
    const t = j / h;
    const l = Math.round(x0 + inset * t);
    const rr = Math.round(x1 - inset * t);
    const row = Math.floor(j / 4);
    for (let x = l; x <= rr; x++) {
      const off = row % 2 ? 4 : 0;
      let col = r[1];
      if (j % 4 === 0) col = r[2];
      else if ((x + off) % 8 === 0) col = r[2];
      else if (j % 4 === 3 && x < (l + rr) / 2) col = r[0];
      if (j < 3) col = r[3];
      c.set(x, y, col);
    }
  }
  // ridge
  const top = base - h;
  c.hline(x0 + inset, x1 - inset, top, r[0]);
  c.hline(x0 + inset, x1 - inset, top + 1, r[0]);
}

function domeRoof(c: PixelCanvas, x0: number, x1: number, base: number, h: number, r: Ramp, seed: number): void {
  const cx = (x0 + x1) / 2;
  const rx = (x1 - x0) / 2 + 4;
  c.ellipseEach(cx, base, rx, h, (x, y, nx, ny) => {
    if (y >= base) return;
    const l = -nx * 0.5 - ny * 0.6;
    c.set(x, y, l > 0.45 ? r[0] : l > -0.1 ? r[1] : r[2]);
  });
  c.hline(Math.round(cx - rx), Math.round(cx + rx), base - 1, r[3]);
  c.hline(Math.round(cx - rx), Math.round(cx + rx), base - 2, r[3]);
  // sesame seeds
  const rnd = rng(seed + 3);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI;
    const d = 0.25 + rnd() * 0.65;
    const x = Math.round(cx + Math.cos(a) * rx * d);
    const y = Math.round(base - 6 - Math.sin(a) * (h - 8) * d);
    c.set(x, y, ramps.wall[0]);
    c.set(x + 1, y, ramps.wall[1]);
  }
  // chef hat on top
  const top = base - h;
  c.shadedEllipse(cx, top - 5, 9, 6, ramps.wall);
  c.rect(Math.round(cx - 6), top - 2, 12, 5, ramps.wall[0]);
  c.hline(Math.round(cx - 6), Math.round(cx + 5), top + 2, ramps.wall[2]);
}

function flatRoof(c: PixelCanvas, x0: number, x1: number, base: number, h: number, r: Ramp): void {
  for (let j = 0; j < h; j++) {
    const y = base - 1 - j;
    for (let x = x0 + 2; x <= x1 - 2; x++) c.set(x, y, j < 3 ? r[3] : j % 6 === 0 ? r[2] : r[1]);
  }
  c.hline(x0 + 2, x1 - 2, base - h, r[0]);
}

function checkers(c: PixelCanvas, x0: number, x1: number, y: number): void {
  for (let x = x0 + 2; x <= x1 - 2; x++) {
    for (let j = 0; j < 4; j++) c.set(x, y + j, (Math.floor((x - x0) / 4) + Math.floor(j / 2)) % 2 ? palette.ink : ramps.wall[0]);
  }
}

function townHallExtras(c: PixelCanvas, cx: number, wallTop: number, st: Style): void {
  // columns either side of the arch
  for (const dx of [-26, 20]) c.shadedRect(cx + dx, wallTop + 8, 6, st.wallH - 12, ramps.wall, 2);
  // a clock in the gable
  const cy = wallTop - st.roofH + 22;
  c.ellipse(cx, cy, 9, 9, ramps.wall[3]);
  c.ellipse(cx, cy, 7, 7, ramps.wall[0]);
  c.vline(cx, cy - 5, cy, palette.ink);
  c.hline(cx, cx + 3, cy, palette.ink);
}
