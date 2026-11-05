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

  // ── interiors (R3)

  floor(c, v) {
    // warm wooden planks, staggered seams
    const w = ramps.wood;
    for (let y = 0; y < T; y++) {
      const plank = Math.floor(y / 4);
      const seam = ((plank * 7 + v * 3) % 16) | 0;
      for (let x = 0; x < T; x++) {
        // lighter boards than outdoor wood: honey base, soft seams
        let col = y % 4 === 3 ? w[1] : y % 4 === 0 ? ramps.stone[0] : w[0];
        if (x === seam && y % 4 !== 3) col = w[1];
        c.set(x, y, col);
      }
    }
    c.set((v * 5 + 3) % T, 1, w[1]);
  },

  wall(c, v) {
    // plaster with a soft vertical wallpaper stripe
    const p = ramps.wall;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) c.set(x, y, (x + v) % 8 === 0 ? p[2] : (x + v) % 8 === 1 ? p[0] : p[1]);
  },

  void(c) {
    c.rect(0, 0, T, T, ramps.shade[3]);
  },

  rug(c) {
    const r = ramps.royal;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) c.set(x, y, (x + y) % 8 === 0 || (x - y + 16) % 8 === 0 ? r[0] : r[1]);
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

// ───────────────────────── transitions (R2)

/**
 * Edge overlays soften the hard tile grid: grass creeping over cobbles, earthy banks along water,
 * leafy forest edges, bridge rails and stair cheeks. Each overlay is a 16×16 cutout drawn on top of a
 * tile, chosen from the kinds of its 8 neighbors.
 *
 * Neighbor order: N, E, S, W, NE, SE, SW, NW.
 */
export function edgeSignature(kind: GroundKind, n: GroundKind[], variant: number): string | null {
  const side = (test: (k: GroundKind) => boolean) => n.slice(0, 4).map((k) => (test(k) ? '1' : '0')).join('');
  const soft = (k: GroundKind) => k === 'grass' || k === 'soil' || k === 'forest';
  let sig = '';
  switch (kind) {
    case 'path':
    case 'plaza': {
      sig = side(soft);
      // inner corners: grass only on the diagonal
      const corners = [0, 1, 2, 3]
        .map((i) => (soft(n[4 + i]) && !soft(n[i]) && !soft(n[(i + 1) % 4]) ? '1' : '0'))
        .join('');
      if (sig === '0000' && corners === '0000') return null;
      return `${kind}:${sig}:${corners}:${variant % 2}`;
    }
    case 'soil':
      sig = side((k) => k === 'grass');
      break;
    case 'water':
      sig = side((k) => k !== 'water' && k !== 'bridge');
      break;
    case 'grass':
      sig = side((k) => k === 'forest');
      break;
    case 'bridge':
      sig = side((k) => k === 'water');
      break;
    case 'stairs':
      sig = side((k) => k !== 'stairs' && k !== 'path');
      break;
    case 'floor':
    case 'rug':
      // shadow under the wall; rugs also get a woven border against the floor
      sig = side((k) => k === 'wall' || k === 'void' || (kind === 'rug' && k === 'floor'));
      break;
    case 'wall':
      // wainscot where the wall meets the floor, crown molding at the top
      sig = side((k) => k !== 'wall');
      break;
    default:
      return null;
  }
  return sig === '0000' ? null : `${kind}:${sig}:0000:${variant % 2}`;
}

export function paintEdge(signature: string): PixelCanvas {
  const [kind, sides, corners, v] = signature.split(':');
  const c = new PixelCanvas(T, T);
  const r = rng(hashString(signature));
  const on = (i: number) => sides[i] === '1';
  // map a side-local coordinate (along, depth) into the tile for side i (0 N, 1 E, 2 S, 3 W)
  const put = (i: number, along: number, d: number, col: string) => {
    const [x, y] = i === 0 ? [along, d] : i === 1 ? [T - 1 - d, along] : i === 2 ? [along, T - 1 - d] : [d, along];
    c.set(x, y, col);
  };
  const g = ramps.grass;
  switch (kind) {
    case 'path':
    case 'plaza':
    case 'soil':
      for (let i = 0; i < 4; i++) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          const depth = 1 + Math.floor(r() * 2.6) + (a % 5 === 2 && r() < 0.6 ? 1 : 0);
          for (let d = 0; d < depth; d++) put(i, a, d, d === depth - 1 ? g[2] : g[1]);
          if (r() < 0.25) put(i, a, depth - 1, g[0]);
          put(i, a, depth, kind === 'soil' ? ramps.soil[2] : (kind === 'plaza' ? ramps.plaza : ramps.stone)[3]);
        }
      }
      // outer corners (grass on two adjacent sides): round the stone off so paths don't look stair-stepped
      for (let i = 0; i < 4; i++) {
        if (!on(i) || !on((i + 1) % 4)) continue;
        const R = 7;
        const right = i === 0 || i === 1; // NE, SE
        const bottom = i === 1 || i === 2; // SE, SW
        const ox = right ? T - R : R;
        const oy = bottom ? T - R : R;
        for (let y = 0; y < T; y++) {
          for (let x = 0; x < T; x++) {
            const inCorner = (right ? x >= ox : x < ox) && (bottom ? y >= oy : y < oy);
            if (!inCorner) continue;
            const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy);
            if (d > R) c.set(x, y, g[1]);
            else if (d > R - 1.2) c.set(x, y, g[2]);
          }
        }
      }
      for (let i = 0; i < 4; i++) {
        if (corners[i] !== '1') continue;
        // NE, SE, SW, NW tufts
        const [cx, cy] = [
          [T - 2, 1],
          [T - 2, T - 2],
          [1, T - 2],
          [1, 1],
        ][i];
        c.ellipse(cx + 0.5, cy + 0.5, 2.2, 2.2, g[1]);
        c.set(cx, cy, g[0]);
      }
      break;
    case 'water': {
      const s = ramps.soil;
      const w = ramps.water;
      for (let i = 0; i < 4; i++) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          if (i === 2) {
            // near (south) bank: grass lip and a bright foam line
            put(i, a, 0, g[2]);
            if (r() < 0.6) put(i, a, 1, g[2]);
            put(i, a, r() < 0.7 ? 2 : 1, w[0]);
          } else {
            // far banks: earthy lip, then shade on the water
            const lip = i === 0 ? 3 : 2;
            for (let d = 0; d < lip; d++) put(i, a, d, d === 0 ? g[2] : d === lip - 1 ? s[2] : s[1]);
            put(i, a, lip, w[3]);
            if ((a + Number(v)) % 2 === 0) put(i, a, lip + 1, w[2]);
          }
        }
      }
      break;
    }
    case 'grass': {
      const f = ramps.foliage;
      for (let i = 0; i < 4; i++) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          const bump = Math.round(2 + 2 * Math.abs(Math.sin((a + Number(v) * 5) * 0.55)) + r());
          for (let d = 0; d < bump; d++) put(i, a, d, d < bump - 1 ? f[3] : f[2]);
          put(i, a, bump, ramps.shade[2]);
          if (r() < 0.5) put(i, a, bump + 1, g[2]);
        }
      }
      break;
    }
    case 'bridge': {
      const w = ramps.wood;
      for (const i of [1, 3]) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          put(i, a, 0, w[3]);
          put(i, a, 1, a % 8 < 2 ? w[3] : w[0]);
          put(i, a, 2, a % 8 < 2 ? w[2] : w[3]);
        }
      }
      break;
    }
    case 'floor':
    case 'rug': {
      for (let i = 0; i < 4; i++) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          if (kind === 'rug') {
            put(i, a, 0, ramps.lamp[2]);
            put(i, a, 1, a % 4 < 2 ? ramps.lamp[1] : ramps.royal[2]);
          } else if (i === 0) {
            // soft shadow cast by the wall above
            put(i, a, 0, ramps.wood[3]);
            put(i, a, 1, ramps.wood[2]);
            if (a % 2 === 0) put(i, a, 2, ramps.wood[2]);
          } else {
            put(i, a, 0, ramps.wood[3]);
          }
        }
      }
      break;
    }
    case 'wall': {
      const w = ramps.wood;
      for (let i = 0; i < 4; i++) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          if (i === 2) {
            // wainscot panel and baseboard
            for (let d = 0; d < 7; d++) put(i, a, d, d === 0 ? w[3] : d === 6 ? w[0] : a % 8 === 0 ? w[2] : w[1]);
          } else if (i === 0) {
            put(i, a, 0, w[3]);
            put(i, a, 1, w[1]);
            put(i, a, 2, w[2]);
          } else {
            put(i, a, 0, ramps.shade[2]);
          }
        }
      }
      break;
    }
    case 'stairs': {
      const sl = ramps.slate;
      for (const i of [1, 3]) {
        if (!on(i)) continue;
        for (let a = 0; a < T; a++) {
          put(i, a, 0, sl[3]);
          put(i, a, 1, sl[2]);
          put(i, a, 2, a % 4 === 0 ? sl[3] : sl[1]);
        }
      }
      break;
    }
  }
  return c;
}

/** Water animation frames: tileable 16×16, highlights drifting downstream. */
export function paintWaterFrames(frames = 4): HTMLCanvasElement[] {
  const w = ramps.water;
  const out: HTMLCanvasElement[] = [];
  const r = rng(404);
  const streaks = Array.from({ length: 5 }, () => ({ x: Math.floor(r() * T), y: Math.floor(r() * T), len: 2 + Math.floor(r() * 4) }));
  for (let f = 0; f < frames; f++) {
    const c = new PixelCanvas(T, T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) c.set(x, y, bayer(x, y + f) < 0.18 ? w[2] : w[1]);
    for (const s of streaks) for (let k = 0; k < s.len; k++) c.set(wrap(s.x + k + f * (T / frames)), s.y, w[0]);
    out.push(c.toCanvas());
  }
  return out;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
