/**
 * Phase-1 environment art, painted at runtime from palette tokens only (ART_BIBLE).
 * Every painter returns a texture whose bottom-center is the object's base.
 * Hand-drawn PNGs can later replace any of these keys via AssetRegistry.
 */
import * as THREE from 'three';
import { palette, outline } from '../art/tokens';
import { mix, rgba } from '../art/color';
import {
  blob, createCanvas, grain, inkedLine, paint, range, rng, smoothClosed, toTexture, wobblyRect,
  type Paintable, type RNG,
} from '../art/painter';
import { assets } from './AssetRegistry';

export interface Painted {
  tex: THREE.Texture;
  /** World-unit size. */
  w: number;
  h: number;
}

const done = (p: Paintable, repeat = false): Painted => ({ tex: toTexture(p.canvas, repeat), w: p.w, h: p.h });

/** Tint every painted pixel toward the horizon sky (aerial perspective). */
function hazeOver(p: Paintable, amount: number): void {
  if (amount <= 0) return;
  const ctx = p.ctx;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = rgba(palette.skyLight, amount);
  ctx.fillRect(0, 0, p.w, p.h);
  ctx.restore();
}

type Pt = [number, number];

// ───────────────────────────── shared small textures

export function softShadowTexture(): THREE.Texture {
  return assets.texture('fx/shadow', () => {
    const p = createCanvas(64, 64, 1);
    const g = p.ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(palette.ink, 0.32));
    g.addColorStop(0.6, rgba(palette.ink, 0.16));
    g.addColorStop(1, rgba(palette.ink, 0));
    p.ctx.fillStyle = g;
    p.ctx.fillRect(0, 0, 64, 64);
    return toTexture(p.canvas);
  });
}

export function glowTexture(): THREE.Texture {
  return assets.texture('fx/glow', () => {
    const p = createCanvas(64, 64, 1);
    const g = p.ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(palette.cream, 1));
    g.addColorStop(0.25, rgba(palette.cream, 0.6));
    g.addColorStop(1, rgba(palette.cream, 0));
    p.ctx.fillStyle = g;
    p.ctx.fillRect(0, 0, 64, 64);
    return toTexture(p.canvas);
  });
}

export function leafTexture(variant: number): Painted {
  return assets.painted(`fx/leaf-${variant}`, () => {
    const p = createCanvas(22, 16);
    const ctx = p.ctx;
    const path = new Path2D();
    path.moveTo(2, 8);
    path.quadraticCurveTo(10, -1, 20, 8);
    path.quadraticCurveTo(10, 17, 2, 8);
    const fill = [palette.sage, palette.sun, palette.blossom][variant % 3];
    paint(ctx, path, { fill, shade: mix(fill, palette.woodDeep, 0.25), shadeSize: 2, outline: 1.5 });
    ctx.strokeStyle = rgba(palette.ink, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 8);
    ctx.lineTo(17, 8);
    ctx.stroke();
    return done(p);
  });
}

export function lightRayTexture(): THREE.Texture {
  return assets.texture('fx/ray', () => {
    const p = createCanvas(64, 256, 1);
    const ctx = p.ctx;
    const v = ctx.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, rgba(palette.cream, 0.0));
    v.addColorStop(0.2, rgba(palette.cream, 0.55));
    v.addColorStop(1, rgba(palette.cream, 0));
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 64, 256);
    ctx.globalCompositeOperation = 'destination-in';
    const h = ctx.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, 'rgba(0,0,0,0)');
    h.addColorStop(0.5, 'rgba(0,0,0,1)');
    h.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = h;
    ctx.fillRect(0, 0, 64, 256);
    return toTexture(p.canvas);
  });
}

// ───────────────────────────── sky

export function skyTexture(): THREE.Texture {
  return assets.texture('env/sky', () => {
    const p = createCanvas(4, 540, 1);
    const g = p.ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, palette.sky);
    g.addColorStop(0.55, mix(palette.sky, palette.skyLight, 0.75));
    g.addColorStop(0.85, palette.skyLight);
    g.addColorStop(1, mix(palette.skyLight, palette.cream, 0.6));
    p.ctx.fillStyle = g;
    p.ctx.fillRect(0, 0, 4, 540);
    const tex = toTexture(p.canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  });
}

export function cloud(seed: number): Painted {
  return assets.painted(`env/cloud-${seed}`, () => {
    const r = rng(seed);
    const p = createCanvas(260, 110);
    const path = new Path2D();
    path.addPath(blob(130, 78, 112, 26, r, 0.04));
    const bumps = 4 + Math.floor(r() * 2);
    for (let i = 0; i < bumps; i++) {
      const x = 50 + (i / (bumps - 1)) * 160 + range(r, -8, 8);
      const rr = range(r, 26, 42) * (1 - Math.abs(i - (bumps - 1) / 2) * 0.12);
      path.addPath(blob(x, 74 - rr * 0.6, rr, rr * 0.9, r, 0.05));
    }
    paint(p.ctx, path, {
      fill: palette.cream,
      shade: mix(palette.skyLight, palette.sky, 0.35),
      shadeSize: 9,
    });
    return done(p);
  });
}

// ───────────────────────────── tileable bands (hills, tree lines, meadows)

interface BandOptions {
  key: string;
  seed: number;
  width: number;
  height: number;
  /** Average edge height from the top. */
  base: number;
  amp: number;
  fill: string;
  shade: string;
  rim?: string;
  crowns?: { count: number; rMin: number; rMax: number };
  haze?: number;
  outline?: number;
}

/** Seamless horizontal band with a soft wavy (optionally tree-crowned) top edge. */
export function band(o: BandOptions): Painted {
  return assets.painted(`band/${o.key}`, () => {
    const r = rng(o.seed);
    const p = createCanvas(o.width, o.height);
    const ctx = p.ctx;
    const W = o.width;
    const waves = [1, 2, 3, 5, 8].map((k) => ({ k, a: range(r, 0.2, 1) / k, ph: r() * Math.PI * 2 }));
    const norm = waves.reduce((s, w) => s + w.a, 0);
    const edge = (x: number) =>
      o.base + (o.amp / norm) * waves.reduce((s, w) => s + w.a * Math.sin((Math.PI * 2 * w.k * x) / W + w.ph), 0);

    const path = new Path2D();
    path.moveTo(-80, o.height + 40);
    for (let x = -80; x <= W + 80; x += 6) path.lineTo(x, edge(x));
    path.lineTo(W + 80, o.height + 40);
    path.closePath();
    if (o.crowns) {
      const { count, rMin, rMax } = o.crowns;
      const crowns: Pt[][] = [];
      for (let i = 0; i < count; i++) {
        const x = (i / count) * W + range(r, -10, 10);
        const rr = range(r, rMin, rMax);
        crowns.push([[x, edge(x) - rr * 0.35], [rr, rr * range(r, 0.85, 1.1)]]);
      }
      for (const [[x, y], [rx, ry]] of crowns) {
        for (const off of [-W, 0, W]) path.addPath(blob(x + off, y, rx, ry, rng(Math.floor(x * 13 + o.seed)), 0.06));
      }
    }
    paint(ctx, path, { fill: o.fill, shade: o.shade, shadeSize: 8, outline: o.outline });
    if (o.rim) {
      ctx.save();
      ctx.clip(path);
      ctx.strokeStyle = rgba(o.rim, 0.55);
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = -80; x <= W + 80; x += 6) ctx.lineTo(x, edge(x) + 4);
      ctx.stroke();
      ctx.restore();
    }
    hazeOver(p, o.haze ?? 0);
    const out = done(p, true);
    return out;
  });
}

// ───────────────────────────── big painted props

export function bigTree(seed: number, haze = 0): Painted {
  return assets.painted(`env/tree-${seed}-${haze}`, () => {
    const r = rng(seed);
    const p = createCanvas(320, 440);
    const ctx = p.ctx;
    const cx = 160;
    // trunk with root flare
    const trunk = smoothClosed([
      [cx - 46, 440], [cx - 30, 420], [cx - 20, 360], [cx - 17, 280], [cx - 14, 210],
      [cx + 14, 210], [cx + 17, 280], [cx + 21, 360], [cx + 32, 420], [cx + 50, 440],
    ]);
    // branches behind canopy
    inkedLine(ctx, [[cx, 260], [cx - 50, 215], [cx - 70, 190]], 9, palette.wood);
    inkedLine(ctx, [[cx + 4, 250], [cx + 56, 205], [cx + 74, 180]], 9, palette.wood);
    paint(ctx, trunk, {
      fill: palette.wood, shade: palette.woodDeep, shadeSize: 9,
      bounds: { x: cx - 46, y: 210, w: 96, h: 230 }, outline: outline.prop, grain: 0.07, seed,
    });
    ctx.strokeStyle = rgba(palette.woodDeep, 0.6);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const x = cx - 10 + i * 6 + range(r, -2, 2);
      ctx.beginPath();
      ctx.moveTo(x, 300 + range(r, -20, 20));
      ctx.quadraticCurveTo(x + range(r, -4, 4), 360, x + range(r, -3, 3), 400 + range(r, -15, 10));
      ctx.stroke();
    }
    // canopy cluster
    const base = mix(palette.sage, palette.sageDeep, range(r, 0, 0.25));
    const canopy = new Path2D();
    const clumps: [number, number, number, number][] = [
      [cx, 160, 118, 88], [cx - 92, 196, 68, 56], [cx + 92, 190, 70, 58],
      [cx - 52, 92, 74, 62], [cx + 50, 86, 76, 60], [cx, 50, 60, 46],
    ];
    for (const [x, y, rx, ry] of clumps) canopy.addPath(blob(x, y, rx, ry, r, 0.07, 18));
    paint(ctx, canopy, {
      fill: base, shade: palette.sageDeep, shadeSize: 16,
      bounds: { x: 10, y: 0, w: 300, h: 260 }, highlightAlpha: 0.3, outline: outline.prop, grain: 0.06, seed: seed + 3,
    });
    // leaf clump marks
    ctx.save();
    ctx.clip(canopy);
    ctx.strokeStyle = rgba(palette.sageDark, 0.45);
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 26; i++) {
      const x = range(r, 30, 290);
      const y = range(r, 30, 240);
      ctx.beginPath();
      ctx.arc(x, y, range(r, 7, 12), Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    // a few blossoms
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? palette.blossom : palette.cream;
      ctx.beginPath();
      ctx.arc(range(r, 40, 280), range(r, 40, 230), 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    hazeOver(p, haze);
    return done(p);
  });
}

export function cottage(seed: number, roof: 'sage' | 'berry' | 'wood', haze = 0): Painted {
  return assets.painted(`env/cottage-${seed}-${roof}-${haze}`, () => {
    const r = rng(seed);
    const p = createCanvas(260, 250);
    const ctx = p.ctx;
    const roofFill = roof === 'sage' ? palette.sageDeep : roof === 'berry' ? palette.berry : palette.wood;
    const roofShade = mix(roofFill, palette.ink, 0.28);

    // chimney
    const chim = wobblyRect(176, 28, 28, 70, 6, r);
    paint(ctx, chim, { fill: palette.creamDeep, shade: palette.woodLight, shadeSize: 5, outline: outline.prop });

    // walls
    const walls = wobblyRect(34, 108, 192, 124, 10, r);
    paint(ctx, walls, {
      fill: palette.woodLight, shade: palette.wood, shadeSize: 10,
      bounds: { x: 34, y: 108, w: 192, h: 124 }, outline: outline.prop, grain: 0.06, seed,
    });
    ctx.save();
    ctx.clip(walls);
    ctx.strokeStyle = rgba(palette.wood, 0.7);
    ctx.lineWidth = 2;
    for (let x = 56; x < 226; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x + range(r, -1, 1), 110);
      ctx.lineTo(x + range(r, -1, 1), 232);
      ctx.stroke();
    }
    ctx.restore();

    // stone base
    const stones = wobblyRect(26, 214, 208, 30, 12, r);
    paint(ctx, stones, { fill: palette.creamDeep, shade: mix(palette.creamDeep, palette.woodLight, 0.6), shadeSize: 5, outline: outline.prop });
    ctx.strokeStyle = rgba(palette.woodDeep, 0.35);
    ctx.lineWidth = 1.6;
    for (let x = 48; x < 230; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 218);
      ctx.lineTo(x + 2, 240);
      ctx.stroke();
    }

    // roof
    const roofPath = smoothClosed([
      [4, 128], [16, 104], [56, 56], [130, 22], [204, 56], [244, 104], [256, 128],
      [214, 136], [130, 130], [46, 136],
    ]);
    paint(ctx, roofPath, {
      fill: roofFill, shade: roofShade, shadeSize: 10,
      bounds: { x: 4, y: 22, w: 252, h: 114 }, outline: outline.prop, grain: 0.07, seed: seed + 2,
    });
    ctx.save();
    ctx.clip(roofPath);
    ctx.strokeStyle = rgba(roofShade, 0.65);
    ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
      const y = 60 + row * 20;
      for (let x = (row % 2) * 14; x < 260; x += 28) {
        ctx.beginPath();
        ctx.arc(x, y, 14, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }
    }
    ctx.restore();

    // door
    const door = new Path2D();
    door.moveTo(106, 232);
    door.lineTo(106, 180);
    door.quadraticCurveTo(106, 156, 128, 156);
    door.quadraticCurveTo(150, 156, 150, 180);
    door.lineTo(150, 232);
    door.closePath();
    paint(ctx, door, { fill: palette.wood, shade: palette.woodDeep, shadeSize: 6, outline: outline.prop });
    ctx.fillStyle = palette.sun;
    ctx.beginPath();
    ctx.arc(142, 198, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = palette.ink;
    ctx.stroke();

    // round windows with warm light
    const windowAt = (x: number, y: number, rr: number) => {
      const w = new Path2D();
      w.arc(x, y, rr, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, rr);
      g.addColorStop(0, palette.cream);
      g.addColorStop(1, palette.sun);
      ctx.fillStyle = g;
      ctx.fill(w);
      ctx.strokeStyle = palette.woodDeep;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - rr, y);
      ctx.lineTo(x + rr, y);
      ctx.moveTo(x, y - rr);
      ctx.lineTo(x, y + rr);
      ctx.stroke();
      ctx.lineWidth = outline.prop + 1;
      ctx.strokeStyle = palette.ink;
      ctx.stroke(w);
    };
    windowAt(68, 172, 17);
    windowAt(190, 172, 17);

    // flower box
    const box = wobblyRect(48, 192, 40, 12, 4, r);
    paint(ctx, box, { fill: palette.wood, shade: palette.woodDeep, shadeSize: 3, outline: outline.small });
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? palette.blossom : palette.sun;
      ctx.beginPath();
      ctx.arc(54 + i * 10, 190, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = palette.ink;
      ctx.stroke();
    }
    hazeOver(p, haze);
    return done(p);
  });
}

export function giantMushroom(seed: number, haze = 0): Painted {
  return assets.painted(`env/mushroom-${seed}-${haze}`, () => {
    const r = rng(seed);
    const p = createCanvas(180, 220);
    const ctx = p.ctx;
    const stem = smoothClosed([[58, 220], [66, 180], [70, 120], [110, 120], [114, 180], [124, 220]]);
    paint(ctx, stem, {
      fill: palette.cream, shade: palette.creamDeep, shadeSize: 8,
      bounds: { x: 58, y: 120, w: 66, h: 100 }, outline: outline.prop,
    });
    // little round window in stem
    const w = new Path2D();
    w.arc(92, 168, 11, 0, Math.PI * 2);
    ctx.fillStyle = palette.sun;
    ctx.fill(w);
    ctx.lineWidth = outline.prop;
    ctx.strokeStyle = palette.ink;
    ctx.stroke(w);
    // cap
    const cap = smoothClosed([[6, 128], [14, 90], [50, 40], [90, 22], [130, 40], [166, 90], [174, 128], [90, 140]]);
    paint(ctx, cap, {
      fill: palette.berry, shade: mix(palette.berry, palette.woodDeep, 0.35), shadeSize: 10,
      bounds: { x: 6, y: 22, w: 168, h: 118 }, highlightAlpha: 0.4, outline: outline.prop, grain: 0.05, seed,
    });
    ctx.save();
    ctx.clip(cap);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = palette.cream;
      ctx.beginPath();
      ctx.ellipse(range(r, 24, 156), range(r, 44, 118), range(r, 8, 15), range(r, 6, 11), range(r, -0.4, 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    hazeOver(p, haze);
    return done(p);
  });
}

// ───────────────────────────── ground & platforms

/** Walkable surface is this many world units below the top of the ground texture. */
export const GROUND_SURFACE = 26;

export function groundTile(): Painted {
  return assets.painted('env/ground', () => {
    const W = 512;
    const H = 320;
    const r = rng(42);
    const p = createCanvas(W, H);
    const ctx = p.ctx;
    // earth body
    ctx.fillStyle = palette.earth;
    ctx.fillRect(0, 36, W, H);
    ctx.strokeStyle = rgba(palette.earthDeep, 0.35);
    ctx.lineWidth = 6;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 110 + k * 52 + Math.sin((x / W) * Math.PI * 2 * (k + 2) + k) * 6);
      ctx.stroke();
    }
    grain(ctx, { x: 0, y: 36, w: W, h: H - 36 }, r, 0.08);
    // pebbles (kept away from tile edges to stay seamless)
    for (let i = 0; i < 9; i++) {
      const x = range(r, 30, W - 30);
      const y = range(r, 90, H - 30);
      const s = blob(x, y, range(r, 7, 16), range(r, 5, 10), r, 0.1);
      paint(ctx, s, { fill: mix(palette.creamDeep, palette.earth, 0.35), shade: mix(palette.earth, palette.earthDeep, 0.4), shadeSize: 3, outline: outline.small });
    }
    // soft roots
    ctx.strokeStyle = rgba(palette.earthDeep, 0.55);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const x = range(r, 60, W - 80);
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.bezierCurveTo(x + 14, 80, x - 6, 110, x + 16, 140);
      ctx.stroke();
    }
    // grass lip (periodic arrays → seamless)
    const blades = 32;
    const tip: number[] = [];
    for (let i = 0; i < blades; i++) tip.push(range(r, 4, 14));
    const drip: number[] = [];
    for (let i = 0; i < 16; i++) drip.push(range(r, 4, 12));
    const grass = new Path2D();
    const step = W / blades;
    // soft rounded tufts instead of spiky blades (ART_BIBLE §3: rounded everywhere)
    grass.moveTo(-step * 2, GROUND_SURFACE);
    for (let i = -2; i <= blades + 2; i++) {
      const x = i * step;
      const h = tip[((i % blades) + blades) % blades] * 0.55;
      grass.quadraticCurveTo(x + step / 2, GROUND_SURFACE - h * 2, x + step, GROUND_SURFACE);
    }
    const dstep = W / 16;
    for (let i = 18; i >= -2; i--) {
      const x = i * dstep;
      grass.quadraticCurveTo(x + dstep / 2, 50 + drip[((i % 16) + 16) % 16], x, 46);
    }
    grass.closePath();
    paint(ctx, grass, { fill: palette.sage, shade: palette.sageDeep, shadeSize: 7, outline: outline.prop });
    ctx.save();
    ctx.clip(grass);
    ctx.strokeStyle = rgba(palette.cream, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_SURFACE + 4);
    ctx.lineTo(W, GROUND_SURFACE + 4);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 3 === 0 ? palette.sun : i % 3 === 1 ? palette.blossom : palette.cream;
      ctx.beginPath();
      ctx.arc(range(r, 20, W - 20), range(r, GROUND_SURFACE + 2, 40), 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    return done(p, true);
  });
}

/** Walkable surface is this many units below the top of a platform texture. */
export const PLATFORM_SURFACE = 12;

export function platform(width: number, seed: number): Painted {
  return assets.painted(`env/platform-${width}-${seed}`, () => {
    const r = rng(seed);
    const h = 56;
    const p = createCanvas(width, h);
    const ctx = p.ctx;
    // vines hanging behind
    for (let i = 0; i < 2; i++) {
      const x = range(r, 20, width - 20);
      inkedLine(ctx, [[x, 30], [x + 3, 44], [x - 2, 54]], 2.4, palette.sageDeep, 1.4);
    }
    const planks = wobblyRect(4, PLATFORM_SURFACE, width - 8, 28, 10, r);
    paint(ctx, planks, {
      fill: palette.woodLight, shade: palette.wood, shadeSize: 6,
      bounds: { x: 4, y: PLATFORM_SURFACE, w: width - 8, h: 28 }, outline: outline.prop, grain: 0.07, seed,
    });
    ctx.save();
    ctx.clip(planks);
    ctx.strokeStyle = rgba(palette.woodDeep, 0.55);
    ctx.lineWidth = 2;
    for (let x = 36; x < width - 20; x += 34 + range(r, -4, 4)) {
      ctx.beginPath();
      ctx.moveTo(x, PLATFORM_SURFACE);
      ctx.lineTo(x + range(r, -1, 1), PLATFORM_SURFACE + 28);
      ctx.stroke();
      ctx.fillStyle = palette.woodDeep;
      ctx.beginPath();
      ctx.arc(x - 6, PLATFORM_SURFACE + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // moss on top
    const moss = new Path2D();
    moss.moveTo(8, PLATFORM_SURFACE + 4);
    for (let x = 8; x <= width - 8; x += 10) moss.lineTo(x, PLATFORM_SURFACE - range(r, 2, 7));
    for (let x = width - 8; x >= 8; x -= 18) moss.quadraticCurveTo(x - 9, PLATFORM_SURFACE + range(r, 6, 11), x - 18, PLATFORM_SURFACE + 3);
    moss.closePath();
    paint(ctx, moss, { fill: palette.sage, shade: palette.sageDeep, shadeSize: 3, outline: outline.small });
    // leaf on hanging vines
    for (let i = 0; i < 2; i++) {
      const l = blob(range(r, 16, width - 16), range(r, 44, 50), 6, 4, r);
      paint(ctx, l, { fill: palette.sage, outline: 1.5 });
    }
    return done(p);
  });
}

// ───────────────────────────── small props

export function signpost(): Painted {
  return assets.painted('prop/signpost', () => {
    const r = rng(5);
    const p = createCanvas(120, 150);
    const ctx = p.ctx;
    const post = wobblyRect(52, 60, 16, 92, 5, r);
    paint(ctx, post, { fill: palette.wood, shade: palette.woodDeep, shadeSize: 4, outline: outline.prop });
    const board = wobblyRect(10, 20, 100, 56, 12, r);
    paint(ctx, board, {
      fill: palette.woodLight, shade: palette.wood, shadeSize: 6,
      bounds: { x: 10, y: 20, w: 100, h: 56 }, outline: outline.prop, grain: 0.08, seed: 5,
    });
    // carved leaf + arrow icon (no raster text: translatable signs live in UI)
    const leaf = new Path2D();
    leaf.moveTo(30, 50);
    leaf.quadraticCurveTo(42, 28, 56, 48);
    leaf.quadraticCurveTo(42, 64, 30, 50);
    paint(ctx, leaf, { fill: palette.sage, shade: palette.sageDeep, shadeSize: 2, outline: 2 });
    inkedLine(ctx, [[64, 48], [92, 48]], 4, palette.woodDeep, 0);
    inkedLine(ctx, [[84, 40], [93, 48], [84, 56]], 4, palette.woodDeep, 0);
    // moss tuft
    paint(ctx, blob(28, 22, 16, 7, r), { fill: palette.sage, shade: palette.sageDeep, shadeSize: 2, outline: 2 });
    return done(p);
  });
}

/** Lantern light offset from the post's bottom-center. */
export const LANTERN_LIGHT = { x: 18, y: 120 };

export function lanternPost(): Painted {
  return assets.painted('prop/lantern', () => {
    const r = rng(9);
    const p = createCanvas(60, 190);
    const ctx = p.ctx;
    const post = wobblyRect(25, 34, 11, 156, 5, r, 0.6);
    paint(ctx, post, { fill: palette.wood, shade: palette.woodDeep, shadeSize: 3, outline: outline.prop });
    inkedLine(ctx, [[30, 42], [50, 40], [48, 50]], 3, palette.woodDeep, 1.5);
    const body = wobblyRect(38, 56, 20, 26, 6, r, 0.5);
    paint(ctx, body, { fill: palette.sun, shade: mix(palette.sun, palette.gentleWrong, 0.5), shadeSize: 3, outline: 2.5 });
    const cap = smoothClosed([[35, 58], [48, 46], [61, 58]]);
    paint(ctx, cap, { fill: palette.woodDeep, outline: 2 });
    ctx.fillStyle = rgba(palette.cream, 0.9);
    ctx.beginPath();
    ctx.ellipse(46, 66, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    return done(p);
  });
}

export function fence(seed: number): Painted {
  return assets.painted(`prop/fence-${seed}`, () => {
    const r = rng(seed);
    const p = createCanvas(200, 80);
    const ctx = p.ctx;
    inkedLine(ctx, [[6, 34], [194, 32 + range(r, -2, 2)]], 7, palette.woodLight, 2);
    inkedLine(ctx, [[6, 56], [194, 55 + range(r, -2, 2)]], 7, palette.woodLight, 2);
    for (const x of [14, 100, 186]) {
      const post = smoothClosed([[x - 8, 80], [x - 8, 22], [x, 12], [x + 8, 22], [x + 8, 80]]);
      paint(ctx, post, { fill: palette.woodLight, shade: palette.wood, shadeSize: 4, outline: outline.prop });
    }
    return done(p);
  });
}

export function barrel(): Painted {
  return assets.painted('prop/barrel', () => {
    const r = rng(11);
    const p = createCanvas(60, 70);
    const ctx = p.ctx;
    const body = smoothClosed([[8, 68], [4, 36], [8, 4], [52, 4], [56, 36], [52, 68]]);
    paint(ctx, body, { fill: palette.wood, shade: palette.woodDeep, shadeSize: 6, bounds: { x: 4, y: 4, w: 52, h: 64 }, outline: outline.prop, grain: 0.07, seed: 11 });
    ctx.save();
    ctx.clip(body);
    ctx.strokeStyle = palette.woodDeep;
    ctx.lineWidth = 4;
    for (const y of [16, 54]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(30, y + 4, 60, y);
      ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(palette.woodDeep, 0.5);
    for (const x of [20, 30, 40]) {
      ctx.beginPath();
      ctx.moveTo(x + range(r, -1, 1), 4);
      ctx.lineTo(x, 68);
      ctx.stroke();
    }
    ctx.restore();
    return done(p);
  });
}

export function crate(): Painted {
  return assets.painted('prop/crate', () => {
    const r = rng(13);
    const p = createCanvas(60, 56);
    const ctx = p.ctx;
    const box = wobblyRect(3, 3, 54, 51, 7, r);
    paint(ctx, box, { fill: palette.woodLight, shade: palette.wood, shadeSize: 5, bounds: { x: 3, y: 3, w: 54, h: 51 }, outline: outline.prop, grain: 0.07, seed: 13 });
    ctx.save();
    ctx.clip(box);
    inkedLine(ctx, [[8, 10], [52, 48]], 5, palette.wood, 1.5);
    inkedLine(ctx, [[3, 28], [57, 28]], 4, palette.wood, 1.5);
    ctx.restore();
    return done(p);
  });
}

export function flowers(seed: number): Painted {
  return assets.painted(`prop/flowers-${seed}`, () => {
    const r = rng(seed);
    const p = createCanvas(80, 52);
    const ctx = p.ctx;
    const color = [palette.blossom, palette.sun, palette.cream, palette.berry][seed % 4];
    const heads = 3 + Math.floor(r() * 3);
    for (let i = 0; i < heads; i++) {
      const x = 12 + (i / (heads - 1)) * 56 + range(r, -4, 4);
      const y = range(r, 12, 28);
      inkedLine(ctx, [[x, 52], [x + range(r, -3, 3), y]], 2.2, palette.sageDeep, 1.2);
      paint(ctx, blob(x + 5, (y + 52) / 2 + 6, 6, 3, r), { fill: palette.sage, outline: 1.5 });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const pp = new Path2D();
        pp.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.2, 0, Math.PI * 2);
        paint(ctx, pp, { fill: color, outline: 1.5 });
      }
      ctx.fillStyle = color === palette.sun ? palette.wood : palette.sun;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    return done(p);
  });
}

export function grassTuft(seed: number): Painted {
  return assets.painted(`prop/tuft-${seed}`, () => {
    const r = rng(seed);
    const p = createCanvas(80, 44);
    const path = new Path2D();
    path.moveTo(4, 44);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = 8 + (i / (n - 1)) * 64;
      path.quadraticCurveTo(x - 6, 30, x + range(r, -6, 6), range(r, 4, 18));
      path.quadraticCurveTo(x + 2, 30, x + 6, 44);
    }
    path.lineTo(76, 44);
    path.closePath();
    const fill = seed % 2 ? palette.sage : palette.sageDeep;
    paint(p.ctx, path, { fill, shade: mix(fill, palette.sageDark, 0.6), shadeSize: 3, outline: outline.small });
    return done(p);
  });
}

export function fern(seed: number): Painted {
  return assets.painted(`prop/fern-${seed}`, () => {
    const r = rng(seed);
    const p = createCanvas(140, 100);
    const ctx = p.ctx;
    // fanned, rounded leaves with a soft midrib — clean silhouette for the foreground
    const leaves = 5;
    for (let f = 0; f < leaves; f++) {
      const t = f / (leaves - 1) - 0.5;
      const a = -Math.PI / 2 + t * 1.9 + range(r, -0.06, 0.06);
      const len = range(r, 64, 84) * (1 - Math.abs(t) * 0.35);
      const bx = 70;
      const by = 100;
      const tx = bx + Math.cos(a) * len;
      const ty = by + Math.sin(a) * len;
      const nx = -Math.sin(a);
      const ny = Math.cos(a);
      const wdt = 13 * (1 - Math.abs(t) * 0.3);
      const mx = (bx + tx) / 2;
      const my = (by + ty) / 2;
      const leaf = new Path2D();
      leaf.moveTo(bx, by);
      leaf.quadraticCurveTo(mx + nx * wdt * 1.4, my + ny * wdt * 1.4, tx, ty);
      leaf.quadraticCurveTo(mx - nx * wdt * 1.4, my - ny * wdt * 1.4, bx, by);
      const fill = f % 2 ? palette.sageDeep : palette.sage;
      paint(ctx, leaf, { fill, shade: mix(fill, palette.sageDark, 0.6), shadeSize: 3, outline: outline.small });
      ctx.strokeStyle = rgba(palette.sageDark, 0.7);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(mx + nx * 2, my + ny * 2, tx - Math.cos(a) * 8, ty - Math.sin(a) * 8);
      ctx.stroke();
    }
    return done(p);
  });
}

export function bush(seed: number, haze = 0): Painted {
  return assets.painted(`prop/bush-${seed}-${haze}`, () => {
    const r = rng(seed);
    const p = createCanvas(160, 96);
    const ctx = p.ctx;
    const path = new Path2D();
    path.addPath(blob(80, 66, 74, 32, r, 0.05));
    path.addPath(blob(46, 56, 40, 34, r));
    path.addPath(blob(92, 44, 46, 40, r));
    path.addPath(blob(126, 60, 32, 28, r));
    paint(ctx, path, {
      fill: palette.sage, shade: palette.sageDeep, shadeSize: 9,
      bounds: { x: 6, y: 4, w: 148, h: 92 }, outline: outline.prop, grain: 0.05, seed,
    });
    if (seed % 2) {
      for (let i = 0; i < 5; i++) {
        const b = new Path2D();
        b.arc(range(r, 30, 130), range(r, 34, 70), 4, 0, Math.PI * 2);
        paint(ctx, b, { fill: palette.berry, outline: 1.5 });
      }
    }
    hazeOver(p, haze);
    return done(p);
  });
}

export function rock(seed: number): Painted {
  return assets.painted(`prop/rock-${seed}`, () => {
    const r = rng(seed);
    const p = createCanvas(80, 50);
    const ctx = p.ctx;
    const s = smoothClosed([[4, 50], [10, 24], [30, 8], [56, 10], [74, 28], [77, 50]]);
    paint(ctx, s, {
      fill: mix(palette.creamDeep, palette.woodLight, 0.35), shade: mix(palette.woodLight, palette.wood, 0.45), shadeSize: 7,
      bounds: { x: 4, y: 8, w: 73, h: 42 }, outline: outline.prop, grain: 0.06, seed,
    });
    paint(ctx, blob(range(r, 30, 46), 12, 18, 6, r), { fill: palette.sage, shade: palette.sageDeep, shadeSize: 2, outline: 2 });
    return done(p);
  });
}

export function stump(): Painted {
  return assets.painted('prop/stump', () => {
    const r = rng(17);
    const p = createCanvas(110, 92);
    const ctx = p.ctx;
    const body = smoothClosed([[2, 92], [12, 76], [14, 20], [96, 20], [98, 76], [108, 92]]);
    paint(ctx, body, {
      fill: palette.wood, shade: palette.woodDeep, shadeSize: 8,
      bounds: { x: 2, y: 20, w: 106, h: 72 }, outline: outline.prop, grain: 0.07, seed: 17,
    });
    const top = new Path2D();
    top.ellipse(55, 20, 42, 12, 0, 0, Math.PI * 2);
    paint(ctx, top, { fill: palette.woodLight, outline: outline.prop });
    ctx.strokeStyle = rgba(palette.wood, 0.8);
    ctx.lineWidth = 1.6;
    for (const k of [0.65, 0.35]) {
      ctx.beginPath();
      ctx.ellipse(55, 20, 42 * k, 12 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    paint(ctx, blob(30, 18, 14, 5, r), { fill: palette.sage, shade: palette.sageDeep, shadeSize: 2, outline: 2 });
    return done(p);
  });
}

export function bunting(width: number, seed: number): Painted {
  return assets.painted(`prop/bunting-${width}-${seed}`, () => {
    const p = createCanvas(width, 64);
    const ctx = p.ctx;
    const sag = 22;
    const y = (x: number) => 8 + sag * 4 * (x / width) * (1 - x / width);
    const ropePts: Pt[] = [];
    for (let x = 0; x <= width; x += 10) ropePts.push([x, y(x)]);
    const colors = [palette.blossom, palette.sun, palette.sage, palette.sky, palette.cream];
    let i = seed;
    for (let x = 18; x < width - 12; x += 28) {
      const yy = y(x);
      const flag = new Path2D();
      flag.moveTo(x - 10, yy);
      flag.quadraticCurveTo(x, yy + 2, x + 10, y(x + 10));
      flag.lineTo(x + 1, yy + 26);
      flag.closePath();
      paint(ctx, flag, { fill: colors[i++ % colors.length], outline: outline.small });
    }
    inkedLine(ctx, ropePts, 2, palette.woodLight, 1.2);
    return done(p);
  });
}

export function groveGate(): Painted {
  return assets.painted('prop/grove-gate', () => {
    const r = rng(23);
    const p = createCanvas(230, 270);
    const ctx = p.ctx;
    // glowing rune behind vines
    const g = ctx.createRadialGradient(115, 150, 4, 115, 150, 70);
    g.addColorStop(0, rgba(palette.sun, 0.9));
    g.addColorStop(1, rgba(palette.sun, 0));
    ctx.fillStyle = g;
    ctx.fillRect(40, 80, 150, 150);
    ctx.strokeStyle = palette.sun;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(115, 150, 30, 0, Math.PI * 2);
    ctx.stroke();
    // posts
    for (const x of [30, 200]) {
      const post = wobblyRect(x - 16, 70, 32, 200, 10, r);
      paint(ctx, post, {
        fill: palette.wood, shade: palette.woodDeep, shadeSize: 7,
        bounds: { x: x - 16, y: 70, w: 32, h: 200 }, outline: outline.prop, grain: 0.07, seed: x,
      });
    }
    // arch of branches
    inkedLine(ctx, [[22, 84], [60, 38], [115, 24], [170, 38], [208, 84]], 14, palette.wood, outline.prop);
    // vine lattice (locked)
    for (let i = 0; i < 5; i++) {
      const x0 = 50 + i * 32;
      inkedLine(ctx, [[x0, 60], [x0 + 10, 130], [x0 - 6, 200], [x0 + 6, 268]], 3.5, palette.sageDeep, 1.4);
    }
    // leaves along arch and vines
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      const onArch = i < 14;
      const x = onArch ? 22 + t * 2 * 186 : range(r, 46, 186);
      const y = onArch ? 84 - Math.sin(Math.min(1, t * 2) * Math.PI) * 58 : range(r, 70, 260);
      paint(ctx, blob(x, y, range(r, 7, 11), range(r, 4, 6), r, 0.05, 10), {
        fill: i % 4 ? palette.sage : palette.sageDeep, shade: palette.sageDeep, shadeSize: 2, outline: 1.6,
      });
    }
    for (let i = 0; i < 4; i++) {
      const b = new Path2D();
      b.arc(range(r, 40, 190), range(r, 40, 220), 4.5, 0, Math.PI * 2);
      paint(ctx, b, { fill: palette.blossom, outline: 1.5 });
    }
    return done(p);
  });
}

export type { RNG };
