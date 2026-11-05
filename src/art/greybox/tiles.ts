/**
 * R1 greybox ground tiles (16×16, 4 variants per kind), painted from palette ramps.
 * Final tilesets replace this atlas in R2 through the asset registry (same layout).
 */
import { PixelCanvas, bayer, rng } from '../pixel';
import { pixel, ramps } from '../tokens';
import { GROUND_KINDS, type GroundKind } from '../../world/map/types';

export const TILE_VARIANTS = 4;
const T = pixel.tile;

/** Atlas: one row per ground kind (GROUND_KINDS order), one column per variant. */
export function paintTileAtlas(): HTMLCanvasElement {
  const atlas = new PixelCanvas(T * TILE_VARIANTS, T * GROUND_KINDS.length);
  GROUND_KINDS.forEach((kind, row) => {
    for (let v = 0; v < TILE_VARIANTS; v++) {
      const tile = new PixelCanvas(T, T);
      PAINTERS[kind](tile, v);
      atlas.blit(tile, v * T, row * T);
    }
  });
  return atlas.toCanvas();
}

const wrap = (n: number) => ((n % T) + T) % T;

const PAINTERS: Record<GroundKind, (c: PixelCanvas, v: number) => void> = {
  grass(c, v) {
    const g = ramps.grass;
    const r = rng(11 + v * 7);
    c.rect(0, 0, T, T, g[1]);
    for (let i = 0; i < 26; i++) c.set(r() * T, r() * T, r() < 0.5 ? g[2] : g[0]);
    // little tufts: a dark base with a light tip
    for (let i = 0; i < 3 + v; i++) {
      const x = Math.floor(r() * T);
      const y = Math.floor(r() * (T - 2)) + 2;
      c.set(wrap(x), y, g[2]);
      c.set(wrap(x + 1), y - 1, g[2]);
      c.set(wrap(x - 1), y - 1, g[2]);
      c.set(wrap(x + 1), y - 2, g[0]);
    }
    if (v === 3) {
      // a tiny flower
      const x = 4 + Math.floor(r() * 8);
      const y = 4 + Math.floor(r() * 8);
      c.set(x, y, ramps.lamp[1]);
      c.set(x + 1, y, ramps.blossom[1]);
      c.set(x, y + 1, ramps.blossom[1]);
    }
  },

  path(c, v) {
    cobbles(c, ramps.stone, 8, 4, 31 + v);
  },

  plaza(c, v) {
    cobbles(c, ramps.plaza, 8, 8, 57 + v);
  },

  water(c, v) {
    const w = ramps.water;
    const r = rng(91 + v * 13);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) c.set(x, y, bayer(x, y) < 0.2 ? w[2] : w[1]);
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(r() * T);
      const y = Math.floor(r() * T);
      const len = 2 + Math.floor(r() * 4);
      for (let k = 0; k < len; k++) c.set(wrap(x + k), y, w[0]);
    }
  },

  bridge(c, v) {
    const w = ramps.wood;
    for (let y = 0; y < T; y++) {
      const plank = y % 4;
      for (let x = 0; x < T; x++) c.set(x, y, plank === 3 ? w[3] : plank === 0 ? w[0] : w[1]);
    }
    const r = rng(77 + v);
    for (let i = 0; i < 4; i++) c.set(Math.floor(r() * T), Math.floor(r() * 4) * 4 + 2, w[2]);
    c.set(1, 1, ramps.slate[2]);
    c.set(14, 1, ramps.slate[2]);
    c.set(1, 9, ramps.slate[2]);
    c.set(14, 9, ramps.slate[2]);
  },

  forest(c, v) {
    const f = ramps.foliage;
    const r = rng(201 + v * 17);
    c.rect(0, 0, T, T, f[3]);
    for (let i = 0; i < 5; i++) {
      const cx = r() * T;
      const cy = r() * T;
      const rad = 3 + r() * 3;
      for (let y = -6; y <= 6; y++) {
        for (let x = -6; x <= 6; x++) {
          const d = Math.hypot(x, y) / rad;
          if (d > 1) continue;
          const lit = -x * 0.5 - y * 0.7 > rad * 0.3;
          c.set(wrap(Math.floor(cx + x)), wrap(Math.floor(cy + y)), lit ? f[1] : f[2]);
        }
      }
    }
  },

  soil(c, v) {
    const s = ramps.soil;
    const r = rng(301 + v);
    c.rect(0, 0, T, T, s[1]);
    for (let y = 2; y < T; y += 4) for (let x = 0; x < T; x++) c.set(x, y, s[2]);
    for (let i = 0; i < 10; i++) c.set(r() * T, r() * T, s[0]);
  },

  stairs(c) {
    const s = ramps.slate;
    for (let y = 0; y < T; y++) {
      const step = y % 4;
      for (let x = 0; x < T; x++) c.set(x, y, step === 0 ? s[0] : step === 3 ? s[3] : s[1]);
    }
  },
};

/** Running-bond cobbles; `bw`×`bh` stones with mortar on the lower/right edge. Tileable when T % bw === 0. */
function cobbles(c: PixelCanvas, ramp: readonly string[], bw: number, bh: number, seed: number): void {
  const r = rng(seed);
  const tones = Array.from({ length: (T / bh) * (T / bw) + 4 }, () => r());
  for (let y = 0; y < T; y++) {
    const row = Math.floor(y / bh);
    const off = row % 2 === 1 ? bw / 2 : 0;
    for (let x = 0; x < T; x++) {
      const lx = (x + off) % bw;
      const ly = y % bh;
      const cell = row * (T / bw) + Math.floor(((x + off) % T) / bw);
      let col = ramp[1];
      if (ly === bh - 1 || lx === bw - 1) col = ramp[2];
      else if (ly === 0 || lx === 0) col = ramp[0];
      else if (tones[cell] < 0.25 && bayer(x, y) < 0.5) col = ramp[2];
      else if (tones[cell] > 0.85 && bayer(x, y) < 0.3) col = ramp[0];
      c.set(x, y, col);
    }
  }
}
