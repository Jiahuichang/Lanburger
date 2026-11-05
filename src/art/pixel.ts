/**
 * Pixel painter: draws grid-exact pixel art at native resolution (1 canvas pixel = 1 art pixel).
 * Colors must come from `tokens.ts` ramps (ART_DIRECTION §4). Light comes from the upper left.
 */
import * as THREE from 'three';
import type { Ramp } from './tokens';
import { hexToRgb } from './color';

type RGB = [number, number, number];
const cache = new Map<string, RGB>();
const rgbOf = (hex: string): RGB => {
  let c = cache.get(hex);
  if (!c) cache.set(hex, (c = hexToRgb(hex)));
  return c;
};

/** 4×4 Bayer matrix, values 0..15 — used for dithered transitions between ramp steps. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer hash for per-tile variation. */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class PixelCanvas {
  readonly data: Uint8ClampedArray;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x: number, y: number, color: string, alpha = 255): void {
    x |= 0;
    y |= 0;
    if (!this.inside(x, y)) return;
    const [r, g, b] = rgbOf(color);
    const i = (y * this.w + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = alpha;
  }

  alpha(x: number, y: number): number {
    if (!this.inside(x, y)) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  clear(x: number, y: number): void {
    if (this.inside(x, y)) this.data[(y * this.w + x) * 4 + 3] = 0;
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color);
  }

  /** Horizontal line from x0 to x1 inclusive. */
  hline(x0: number, x1: number, y: number, color: string): void {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, color);
  }

  vline(x: number, y0: number, y1: number, color: string): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, color);
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string): void {
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Filled ellipse in one flat color. Center may be fractional (x.5 = centered between pixels). */
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    this.ellipseEach(cx, cy, rx, ry, (x, y) => this.set(x, y, color));
  }

  ellipseEach(cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number, nx: number, ny: number) => void): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny);
      }
    }
  }

  /**
   * A lit ellipse: highlight upper-left, shade lower-right, dithered between steps.
   * `ramp[3]` is not used for the fill (it is for outlines and deep shadows).
   */
  shadedEllipse(cx: number, cy: number, rx: number, ry: number, ramp: Ramp, bias = 0): void {
    this.ellipseEach(cx, cy, rx, ry, (x, y, nx, ny) => {
      // light from upper-left; sphere-ish normal
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const l = -nx * 0.45 - ny * 0.6 + nz * 0.55 + bias;
      this.set(x, y, pickRamp(ramp, l, x, y));
    });
  }

  /** A lit box: top rows highlight, right column shade. */
  shadedRect(x: number, y: number, w: number, h: number, ramp: Ramp, topLight = 1): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        let c = ramp[1];
        if (j < topLight) c = ramp[0];
        else if (i >= w - 1 || j >= h - 1) c = ramp[2];
        this.set(x + i, y + j, c);
      }
    }
  }

  /** Paint `color` onto every transparent pixel that touches an opaque one (4-neighborhood). */
  outline(color: string, diagonal = false): void {
    const marks: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) !== 0) continue;
        const n =
          this.alpha(x - 1, y) || this.alpha(x + 1, y) || this.alpha(x, y - 1) || this.alpha(x, y + 1) ||
          (diagonal && (this.alpha(x - 1, y - 1) || this.alpha(x + 1, y - 1) || this.alpha(x - 1, y + 1) || this.alpha(x + 1, y + 1)));
        if (n) marks.push(x, y);
      }
    }
    for (let i = 0; i < marks.length; i += 2) this.set(marks[i], marks[i + 1], color);
  }

  /** Copy another canvas onto this one (opaque pixels only), optionally mirrored. */
  blit(src: PixelCanvas, dx: number, dy: number, flip = false): void {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4;
        if (src.data[i + 3] === 0) continue;
        const tx = dx + (flip ? src.w - 1 - x : x);
        const ty = dy + y;
        if (!this.inside(tx, ty)) continue;
        const j = (ty * this.w + tx) * 4;
        this.data[j] = src.data[i];
        this.data[j + 1] = src.data[i + 1];
        this.data[j + 2] = src.data[i + 2];
        this.data[j + 3] = src.data[i + 3];
      }
    }
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.h);
    img.data.set(this.data);
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

/** Choose a ramp step from a light value (≈ -1 … 1) with ordered dithering at the boundaries. */
export function pickRamp(ramp: Ramp, light: number, x: number, y: number): string {
  const d = bayer(x, y) * 0.16 - 0.08;
  const v = light + d;
  if (v > 0.55) return ramp[0];
  if (v > 0.05) return ramp[1];
  if (v > -0.45) return ramp[2];
  return ramp[3];
}

/** Grid-exact texture: nearest filtering, no mipmaps, sRGB. */
export function pixelTexture(source: HTMLCanvasElement | HTMLImageElement | ImageBitmap): THREE.Texture {
  const tex = source instanceof HTMLCanvasElement ? new THREE.CanvasTexture(source) : new THREE.Texture(source);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
