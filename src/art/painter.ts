/**
 * Canvas2D "hand-painted" helpers used by procedural art and the placeholder character.
 * Everything follows ART_BIBLE §3: warm ink outlines, rounded wobbly shapes, two-tone cel shading
 * with an upper-left light, and a faint painted grain.
 */
import * as THREE from 'three';
import { palette } from './tokens';
import { rgba } from './color';

export type RNG = () => number;

/** Deterministic PRNG (mulberry32) so painted art is stable between runs. */
export function rng(seed: number): RNG {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (r: RNG, min: number, max: number) => min + r() * (max - min);

/** Canvas px per world unit. Art is painted at 2× so it stays crisp on high-DPI screens. */
export const PAINT_SCALE = 2;

export interface Paintable {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Size in world units (the ctx is pre-scaled, so draw in world units). */
  w: number;
  h: number;
}

export function createCanvas(w: number, h: number, scale = PAINT_SCALE): Paintable {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * scale));
  canvas.height = Math.max(1, Math.ceil(h * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  return { canvas, ctx, w, h };
}

type Pt = [number, number];

/** Smooth closed curve through points (quadratic curves via midpoints). */
export function smoothClosed(points: Pt[]): Path2D {
  const p = new Path2D();
  const n = points.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(points[n - 1], points[0]);
  p.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const c = points[i];
    const m = mid(c, points[(i + 1) % n]);
    p.quadraticCurveTo(c[0], c[1], m[0], m[1]);
  }
  p.closePath();
  return p;
}

/** A wobbly ellipse — the basic building block of foliage, clouds, heads, mushrooms. */
export function blob(cx: number, cy: number, rx: number, ry: number, r: RNG, wobble = 0.06, n = 16): Path2D {
  const pts: Pt[] = [];
  const phase = r() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    const k = 1 + (r() * 2 - 1) * wobble;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

/** Rounded rectangle whose edges wobble a little, like an inked brush line. */
export function wobblyRect(x: number, y: number, w: number, h: number, rad: number, r: RNG, jitter = 1.2): Path2D {
  rad = Math.min(rad, w / 2, h / 2);
  const pts: Pt[] = [];
  const j = () => (r() * 2 - 1) * jitter;
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 3; i++) {
      const a = a0 + (i / 3) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * rad + j() * 0.3, cy + Math.sin(a) * rad + j() * 0.3]);
    }
  };
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(len / 28));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      pts.push([x0 + (x1 - x0) * t + j(), y0 + (y1 - y0) * t + j()]);
    }
  };
  corner(x + w - rad, y + rad, -Math.PI / 2);
  edge(x + w, y + rad, x + w, y + h - rad);
  corner(x + w - rad, y + h - rad, 0);
  edge(x + w - rad, y + h, x + rad, y + h);
  corner(x + rad, y + h - rad, Math.PI / 2);
  edge(x, y + h - rad, x, y + rad);
  corner(x + rad, y + rad, Math.PI);
  edge(x + rad, y, x + w - rad, y);
  return smoothClosed(pts);
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PaintOptions {
  fill: string;
  /** Cel-shadow color (lower-right band). */
  shade?: string;
  /** Size of the shadow band in world units. */
  shadeSize?: number;
  /** Bounds for highlight + grain. */
  bounds?: Bounds;
  highlight?: boolean;
  highlightAlpha?: number;
  grain?: number;
  outline?: number;
  outlineColor?: string;
  seed?: number;
}

/** Fill a path with two-tone cel shading, upper-left highlight, grain and a warm ink outline. */
export function paint(ctx: CanvasRenderingContext2D, path: Path2D, o: PaintOptions): void {
  // Outline first at double width, then the fill covers its inner half. For unions of blobs
  // (canopies, clouds) this leaves only the outer silhouette inked, like a real brush line.
  if (o.outline) {
    ctx.save();
    ctx.lineWidth = o.outline * 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = o.outlineColor ?? palette.ink;
    ctx.stroke(path);
    ctx.restore();
  }
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = o.shade ?? o.fill;
  ctx.fill(path);
  if (o.shade) {
    const s = o.shadeSize ?? 6;
    ctx.save();
    ctx.translate(-s, -s * 0.85);
    ctx.fillStyle = o.fill;
    ctx.fill(path);
    ctx.restore();
  }
  if (o.bounds && o.highlight !== false) {
    const b = o.bounds;
    const g = ctx.createRadialGradient(b.x + b.w * 0.3, b.y + b.h * 0.25, 0, b.x + b.w * 0.3, b.y + b.h * 0.25, Math.max(b.w, b.h) * 0.45);
    g.addColorStop(0, rgba(palette.cream, o.highlightAlpha ?? 0.35));
    g.addColorStop(1, rgba(palette.cream, 0));
    ctx.fillStyle = g;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
  if (o.bounds && o.grain) grain(ctx, o.bounds, rng(o.seed ?? 7), o.grain);
  ctx.restore();
}

/** Painted speckle grain (ART_BIBLE: opacity ≤ 8 %). */
export function grain(ctx: CanvasRenderingContext2D, b: Bounds, r: RNG, alpha = 0.06): void {
  const count = Math.floor((b.w * b.h) / 60);
  for (let i = 0; i < count; i++) {
    const dark = r() < 0.55;
    ctx.fillStyle = rgba(dark ? palette.ink : palette.cream, alpha * range(r, 0.4, 1));
    const s = range(r, 0.6, 1.8);
    ctx.fillRect(b.x + r() * b.w, b.y + r() * b.h, s, s);
  }
}

/** A thick ink stroke with a colored core — used for limbs, ropes, branches. */
export function inkedLine(ctx: CanvasRenderingContext2D, pts: Pt[], width: number, color: string, ink = 3): void {
  const draw = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = width + ink * 2;
  draw();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  draw();
}

/** Convert a painted canvas to a Three.js texture with correct color space and premultiplied alpha. */
export function toTexture(canvas: HTMLCanvasElement, repeat = false): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.premultiplyAlpha = true;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}
