/**
 * R1 greybox props. Each painter returns a canvas plus its anchor (the pixel that sits on the
 * foot point). Environment outlines use the ramp's deepest step, not black (ART_DIRECTION §1.3).
 */
import { PixelCanvas, rng } from '../pixel';
import { ramps, type Ramp } from '../tokens';
import type { PropKind } from '../../world/map/types';

export interface Painted {
  canvas: HTMLCanvasElement;
  anchor: { x: number; y: number };
}

const done = (c: PixelCanvas, ax: number, ay: number): Painted => ({ canvas: c.toCanvas(), anchor: { x: ax, y: ay } });

export function paintProp(kind: PropKind, seed = 0): Painted {
  return PROPS[kind](seed);
}

const PROPS: Record<PropKind, (seed: number) => Painted> = {
  tree: (seed) => tree(seed, ramps.foliage),
  blossomTree: (seed) => tree(seed, ramps.blossom),

  bush(seed) {
    const c = new PixelCanvas(26, 20);
    const f = ramps.foliage;
    c.shadedEllipse(8, 12, 7, 6, f);
    c.shadedEllipse(18, 12, 7, 6, f);
    c.shadedEllipse(13, 8, 8, 6, f);
    speckle(c, f[0], f, seed, 10);
    c.outline(f[3]);
    return done(c, 13, 18);
  },

  lamp() {
    const c = new PixelCanvas(14, 46);
    const s = ramps.shade;
    c.rect(6, 12, 2, 32, s[2]);
    c.set(6, 12, s[0]);
    c.rect(4, 42, 6, 3, s[2]);
    c.rect(3, 4, 8, 9, s[3]);
    c.rect(4, 5, 6, 7, ramps.lamp[1]);
    c.rect(5, 6, 3, 4, ramps.lamp[0]);
    c.rect(2, 2, 10, 2, s[2]);
    c.rect(5, 0, 4, 2, s[2]);
    c.outline(ramps.shade[3]);
    return done(c, 7, 44);
  },

  bench() {
    const c = new PixelCanvas(32, 18);
    const w = ramps.wood;
    c.rect(2, 2, 28, 3, w[1]);
    c.hline(2, 29, 2, w[0]);
    c.rect(2, 8, 28, 4, w[1]);
    c.hline(2, 29, 8, w[0]);
    c.hline(2, 29, 11, w[2]);
    c.rect(4, 5, 2, 11, w[2]);
    c.rect(26, 5, 2, 11, w[2]);
    c.outline(w[3]);
    return done(c, 16, 16);
  },

  flowerBed(seed) {
    const c = new PixelCanvas(34, 18);
    const w = ramps.wood;
    c.rect(1, 9, 32, 8, w[1]);
    c.hline(1, 32, 9, w[0]);
    c.hline(1, 32, 16, w[2]);
    for (let x = 8; x < 32; x += 8) c.vline(x, 10, 15, w[2]);
    c.rect(2, 6, 30, 4, ramps.soil[2]);
    const r = rng(seed + 5);
    const petals = [ramps.blossom[1], ramps.lamp[1], ramps.royal[0], ramps.blossom[0], ramps.bunOrange[0]];
    for (let i = 0; i < 9; i++) {
      const x = 3 + Math.floor(r() * 28);
      const y = 2 + Math.floor(r() * 5);
      c.set(x, y + 2, ramps.foliage[2]);
      c.set(x - 1, y + 1, ramps.foliage[1]);
      const col = petals[Math.floor(r() * petals.length)];
      c.set(x, y, col);
      c.set(x + 1, y, col);
      c.set(x, y - 1, col);
      c.set(x + 1, y + 1, ramps.lamp[0]);
    }
    c.outline(w[3]);
    return done(c, 17, 17);
  },

  flowers(seed) {
    const c = new PixelCanvas(14, 10);
    const r = rng(seed + 9);
    const petals = [ramps.blossom[0], ramps.lamp[1], ramps.royal[0]];
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(r() * 10);
      const y = 2 + Math.floor(r() * 4);
      c.vline(x, y + 1, 9, ramps.grass[2]);
      const col = petals[Math.floor(r() * petals.length)];
      c.set(x, y, col);
      c.set(x - 1, y, col);
      c.set(x + 1, y, col);
      c.set(x, y - 1, col);
      c.set(x, y + 0, ramps.lamp[0]);
    }
    return done(c, 7, 9);
  },

  crate() {
    const c = new PixelCanvas(16, 16);
    const w = ramps.wood;
    c.shadedRect(1, 1, 14, 14, w);
    c.line(2, 2, 13, 13, w[2]);
    c.line(13, 2, 2, 13, w[2]);
    c.hline(1, 14, 1, w[0]);
    c.outline(w[3]);
    return done(c, 8, 15);
  },

  barrel() {
    const c = new PixelCanvas(14, 18);
    const w = ramps.wood;
    c.shadedEllipse(7, 9, 6, 8, w);
    c.ellipse(7, 3, 5, 2, w[2]);
    c.hline(1, 12, 5, ramps.slate[2]);
    c.hline(1, 12, 13, ramps.slate[2]);
    c.outline(w[3]);
    return done(c, 7, 17);
  },

  banner() {
    const c = new PixelCanvas(14, 44);
    const s = ramps.slate;
    const ro = ramps.royal;
    c.rect(6, 2, 2, 41, s[2]);
    c.rect(5, 0, 4, 2, ramps.lamp[2]);
    c.rect(1, 4, 12, 2, s[1]);
    c.rect(2, 6, 10, 18, ro[1]);
    c.vline(2, 6, 23, ro[0]);
    c.vline(11, 6, 23, ro[2]);
    c.set(2, 24, ro[1]);
    c.set(3, 25, ro[1]);
    c.set(11, 24, ro[1]);
    c.set(10, 25, ro[1]);
    c.rect(4, 24, 6, 1, ro[1]);
    // burger emblem
    c.rect(5, 11, 4, 2, ramps.bunOrange[0]);
    c.rect(5, 13, 4, 1, ramps.patty[1]);
    c.rect(5, 14, 4, 1, ramps.bunOrange[1]);
    c.outline(ro[3]);
    return done(c, 7, 43);
  },

  fountain() {
    const c = new PixelCanvas(96, 70);
    const s = ramps.slate;
    const w = ramps.water;
    // basin rim and water
    c.shadedEllipse(48, 50, 46, 18, s);
    c.ellipse(48, 49, 40, 14, s[3]);
    c.ellipse(48, 50, 39, 13, w[1]);
    c.ellipseEach(48, 50, 39, 13, (x, y, _nx, ny) => {
      if (ny < -0.55) c.set(x, y, w[2]);
      else if ((x + y * 3) % 11 === 0) c.set(x, y, w[0]);
    });
    c.ellipse(48, 57, 46, 4, s[2]);
    c.hline(10, 86, 61, s[3]);
    // pillar and upper bowl
    c.shadedRect(43, 26, 10, 24, s, 2);
    c.shadedEllipse(48, 27, 16, 5, s);
    c.ellipse(48, 26, 13, 3, w[1]);
    // the Lanburger statue on top
    c.shadedEllipse(48, 18, 9, 3, ramps.bunOrange);
    c.rect(40, 14, 17, 2, ramps.patty[1]);
    c.hline(40, 56, 13, ramps.foliage[1]);
    c.shadedEllipse(48, 10, 9, 6, ramps.bunOrange);
    c.rect(39, 10, 19, 4, ramps.bunOrange[1]);
    for (const [x, y] of [[44, 6], [49, 5], [52, 8], [46, 9]]) c.set(x, y, ramps.wall[0]);
    // water spouts
    for (let i = 0; i < 6; i++) {
      c.set(34 - i * 2, 27 + i * 3, w[0]);
      c.set(62 + i * 2, 27 + i * 3, w[0]);
    }
    c.outline(s[3]);
    return done(c, 48, 62);
  },

  rock(seed) {
    const c = new PixelCanvas(18, 12);
    c.shadedEllipse(9, 7, 8, 5, ramps.slate);
    if (seed % 2) c.shadedEllipse(13, 8, 4, 3, ramps.slate);
    c.outline(ramps.slate[3]);
    return done(c, 9, 11);
  },

  sign() {
    const c = new PixelCanvas(20, 26);
    const w = ramps.wood;
    c.rect(9, 12, 2, 13, w[2]);
    c.shadedRect(1, 2, 18, 11, w, 1);
    c.hline(3, 16, 5, w[2]);
    c.hline(3, 13, 8, w[2]);
    c.outline(w[3]);
    return done(c, 10, 25);
  },
};

/** Word Lantern: dark until its topic is mastered, then a warm lamp. */
export function paintLantern(lit: boolean): Painted {
  const c = new PixelCanvas(14, 34);
  const w = ramps.wood;
  c.rect(6, 14, 2, 18, w[2]);
  c.rect(4, 31, 6, 2, w[3]);
  c.rect(2, 4, 10, 12, ramps.shade[3]);
  if (lit) {
    c.rect(3, 5, 8, 10, ramps.lamp[1]);
    c.rect(5, 7, 4, 6, ramps.lamp[0]);
  } else {
    c.rect(3, 5, 8, 10, ramps.shade[1]);
    c.rect(4, 6, 2, 3, ramps.shade[0]);
  }
  c.rect(1, 2, 12, 2, ramps.royal[2]);
  c.rect(5, 0, 4, 2, ramps.royal[1]);
  c.rect(1, 16, 12, 1, ramps.royal[2]);
  c.outline(ramps.shade[3]);
  return done(c, 7, 33);
}

function tree(seed: number, canopy: Ramp): Painted {
  const c = new PixelCanvas(52, 66);
  const w = ramps.wood;
  const r = rng(seed + 1);
  // trunk with a little root flare
  c.rect(23, 40, 6, 22, w[1]);
  c.vline(23, 40, 61, w[0]);
  c.vline(28, 40, 61, w[2]);
  c.rect(21, 60, 10, 3, w[2]);
  // canopy: clustered lit blobs
  const blobs: [number, number, number, number][] = [
    [26, 30, 21, 15],
    [14, 34, 11, 9],
    [38, 34, 11, 9],
    [26, 17, 15, 11],
    [17 + r() * 4, 24, 10, 8],
    [35 - r() * 4, 24, 10, 8],
  ];
  for (const [x, y, rx, ry] of blobs) c.shadedEllipse(x, y, rx, ry, canopy);
  speckle(c, canopy[0], canopy, seed, 30);
  c.outline(canopy[3]);
  // soft contact shade at the trunk base
  c.hline(20, 31, 63, ramps.shade[2]);
  return done(c, 26, 63);
}

/** Sprinkle highlight leaves only onto already lit pixels. */
function speckle(c: PixelCanvas, color: string, ramp: Ramp, seed: number, n: number): void {
  const r = rng(seed + 33);
  for (let i = 0; i < n * 4 && n > 0; i++) {
    const x = Math.floor(r() * c.w);
    const y = Math.floor(r() * c.h);
    const i4 = (y * c.w + x) * 4;
    if (c.data[i4 + 3] === 0) continue;
    const hex = `#${[c.data[i4], c.data[i4 + 1], c.data[i4 + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    if (hex === ramp[1]) {
      c.set(x, y, color);
      n--;
    }
  }
}
