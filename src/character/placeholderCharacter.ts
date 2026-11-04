/**
 * TEMPORARY PLACEHOLDER PROTAGONIST.
 *
 * A deliberately generic wooden "artist's mannequin" with a "?" on its chest and a PLACEHOLDER tag.
 * It is NOT the final character design — the final protagonist will be supplied as original art.
 * It is generated as a normal sprite sheet + manifest, so the real art drops in without code changes.
 */
import { palette, outline } from '../art/tokens';
import { rgba } from '../art/color';
import { createCanvas, inkedLine, paint, rng } from '../art/painter';
import type { AnimState, CharacterSpriteManifest, LoadedCharacterSprite } from './types';

const FRAME = 256; // px per frame
const U = FRAME / 160; // design units → px (we design poses on a 160-unit frame)
const FEET_Y = 150; // design units

const CLIPS: Record<AnimState, { row: number; frames: number; fps: number; loop: boolean }> = {
  idle: { row: 0, frames: 6, fps: 6, loop: true },
  walk: { row: 1, frames: 6, fps: 10, loop: true },
  jump: { row: 2, frames: 2, fps: 8, loop: false },
  fall: { row: 3, frames: 2, fps: 6, loop: true },
  interact: { row: 4, frames: 4, fps: 10, loop: false },
  celebrate: { row: 5, frames: 6, fps: 10, loop: false },
  incorrect: { row: 6, frames: 6, fps: 10, loop: false },
};

type Eyes = 'dot' | 'closed' | 'happy' | 'wide' | 'dizzy';
type Mouth = 'none' | 'smile' | 'open' | 'o' | 'wobble';
type Fx = 'none' | 'stars' | 'sweat' | 'spark';

interface Pose {
  bob: number;
  sx: number;
  sy: number;
  lean: number;
  headTilt: number;
  armF: number;
  armB: number;
  legF: number;
  legB: number;
  eyes: Eyes;
  mouth: Mouth;
  fx: Fx;
  fxPhase: number;
}

const base = (): Pose => ({
  bob: 0, sx: 1, sy: 1, lean: 0, headTilt: 0, armF: 0.12, armB: -0.12, legF: 0.04, legB: -0.04,
  eyes: 'dot', mouth: 'none', fx: 'none', fxPhase: 0,
});

function pose(state: AnimState, i: number, n: number): Pose {
  const p = base();
  const ph = (i / n) * Math.PI * 2;
  switch (state) {
    case 'idle':
      p.bob = -Math.sin(ph) * 1.6 - 1.6;
      p.sy = 1 + Math.sin(ph) * 0.012;
      p.armF = 0.12 + Math.sin(ph) * 0.05;
      p.armB = -0.12 - Math.sin(ph) * 0.05;
      if (i === 4) p.eyes = 'closed';
      break;
    case 'walk':
      p.legF = Math.sin(ph) * 0.6;
      p.legB = -Math.sin(ph) * 0.6;
      p.armF = -Math.sin(ph) * 0.55;
      p.armB = Math.sin(ph) * 0.55;
      p.bob = -Math.abs(Math.cos(ph)) * 4;
      p.lean = 0.07;
      p.mouth = 'smile';
      break;
    case 'jump':
      p.sy = i === 0 ? 1.07 : 1.03;
      p.sx = i === 0 ? 0.95 : 0.98;
      p.armF = 2.55 - i * 0.15;
      p.armB = -2.4 + i * 0.15;
      p.legF = 0.55;
      p.legB = -0.25;
      p.eyes = 'wide';
      p.mouth = 'o';
      break;
    case 'fall':
      p.armF = 1.9 + (i ? 0.2 : 0);
      p.armB = -1.9 - (i ? 0.2 : 0);
      p.legF = 0.25;
      p.legB = -0.3;
      p.eyes = 'wide';
      p.mouth = 'open';
      break;
    case 'interact': {
      const reach = [0.35, 1.2, 1.5, 1.35][i];
      p.armF = reach;
      p.lean = [0.03, 0.09, 0.12, 0.1][i];
      p.mouth = 'smile';
      p.fx = i >= 2 ? 'spark' : 'none';
      p.fxPhase = i - 2;
      break;
    }
    case 'celebrate':
      p.bob = [0, -9, -15, -9, 0, -3][i];
      p.sy = [0.93, 1.05, 1.03, 1.0, 0.94, 1.0][i];
      p.sx = 2 - p.sy;
      p.armF = 2.65 + Math.sin(ph * 2) * 0.25;
      p.armB = -2.65 + Math.sin(ph * 2) * 0.25;
      p.legF = i >= 1 && i <= 3 ? 0.35 : 0.05;
      p.legB = i >= 1 && i <= 3 ? -0.35 : -0.05;
      p.eyes = 'happy';
      p.mouth = 'open';
      p.fx = 'stars';
      p.fxPhase = i / n;
      break;
    case 'incorrect':
      p.headTilt = [-0.16, 0.16, -0.12, 0.12, -0.05, 0][i];
      p.lean = -0.04;
      p.sy = 0.96;
      p.bob = 1;
      p.armF = 0.18 + (i % 2) * 0.06;
      p.armB = -0.18;
      p.eyes = i < 4 ? 'dizzy' : 'closed';
      p.mouth = 'wobble';
      p.fx = 'sweat';
      p.fxPhase = i / n;
      break;
  }
  return p;
}

function drawFrame(ctx: CanvasRenderingContext2D, p: Pose, seed: number): void {
  const r = rng(seed);
  ctx.save();
  ctx.translate(80, FEET_Y);
  ctx.scale(p.sx, p.sy);
  ctx.rotate(p.lean);
  ctx.translate(0, p.bob);

  const limbColor = palette.creamDeep;
  const limb = (x: number, y: number, a: number, len: number, w: number, color: string) => {
    const ex = x + Math.sin(a) * len;
    const ey = y + Math.cos(a) * len;
    inkedLine(ctx, [[x, y], [ex, ey]], w, color, outline.character);
    // round joint "hand/foot" ball
    ctx.beginPath();
    ctx.arc(ex, ey, w * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const backTone = palette.woodLight;
  // back limbs (slightly darker = further away)
  limb(-6, -26, p.legB, 18, 12, backTone);
  limb(-9, -54, p.armB, 19, 9.5, backTone);

  // torso
  const torso = new Path2D();
  torso.roundRect(-16, -62, 32, 40, 13);
  paint(ctx, torso, {
    fill: limbColor, shade: palette.woodLight, shadeSize: 5,
    bounds: { x: -16, y: -62, w: 32, h: 40 }, outline: outline.character, grain: 0.05, seed,
  });
  // "?" emblem = obviously a placeholder
  ctx.fillStyle = palette.woodDeep;
  ctx.font = '700 20px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 1, -41);

  // front leg
  limb(6, -26, p.legF, 18, 12, limbColor);

  // head
  ctx.save();
  ctx.translate(2, -90);
  ctx.rotate(p.headTilt);
  const head = new Path2D();
  head.ellipse(0, 0, 31, 29, 0, 0, Math.PI * 2);
  paint(ctx, head, {
    fill: palette.cream, shade: palette.creamDeep, shadeSize: 6,
    bounds: { x: -31, y: -29, w: 62, h: 58 }, outline: outline.character, grain: 0.04, seed: seed + 1,
  });
  // mannequin seam
  ctx.strokeStyle = palette.woodLight;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.ellipse(-6, 0, 10, 27, 0, -Math.PI / 2, Math.PI / 2, true);
  ctx.stroke();
  ctx.setLineDash([]);
  drawFace(ctx, p);
  ctx.restore();

  // front arm (on top)
  limb(9, -54, p.armF, 19, 9.5, limbColor);

  drawFx(ctx, p, r);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, p: Pose): void {
  const ex1 = 9;
  const ex2 = 22;
  const ey = 2;
  ctx.fillStyle = palette.ink;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  const both = (fn: (x: number) => void) => {
    fn(ex1);
    fn(ex2);
  };
  switch (p.eyes) {
    case 'dot':
      both((x) => {
        ctx.beginPath();
        ctx.ellipse(x, ey, 3.2, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    case 'wide':
      both((x) => {
        ctx.beginPath();
        ctx.arc(x, ey, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = palette.cream;
        ctx.beginPath();
        ctx.arc(x - 1.4, ey - 1.6, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = palette.ink;
      });
      break;
    case 'closed':
      both((x) => {
        ctx.beginPath();
        ctx.moveTo(x - 3.5, ey + 1);
        ctx.lineTo(x + 3.5, ey + 1);
        ctx.stroke();
      });
      break;
    case 'happy':
      both((x) => {
        ctx.beginPath();
        ctx.arc(x, ey + 2, 3.8, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });
      break;
    case 'dizzy':
      both((x) => {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3.2; a += 0.3) {
          const rr = 0.6 + a * 0.38;
          const px = x + Math.cos(a) * rr;
          const py = ey + Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.lineWidth = 2.4;
      });
      break;
  }
  // blush
  ctx.fillStyle = rgba(palette.blossom, 0.6);
  ctx.beginPath();
  ctx.ellipse(5, 11, 4, 2.4, 0, 0, Math.PI * 2);
  ctx.ellipse(26, 11, 4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // mouth
  const mx = 16;
  const my = 13;
  ctx.fillStyle = palette.ink;
  switch (p.mouth) {
    case 'smile':
      ctx.beginPath();
      ctx.arc(mx, my - 2, 3.4, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      break;
    case 'open':
      ctx.beginPath();
      ctx.arc(mx, my - 1, 4, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = palette.berry;
      ctx.beginPath();
      ctx.arc(mx, my + 1.5, 2, 0, Math.PI);
      ctx.fill();
      break;
    case 'o':
      ctx.beginPath();
      ctx.ellipse(mx, my, 2.4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'wobble':
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(mx - 5, my);
      for (let k = 1; k <= 4; k++) ctx.lineTo(mx - 5 + k * 2.5, my + (k % 2 ? -1.6 : 1.2));
      ctx.stroke();
      break;
    case 'none':
      break;
  }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string): void {
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = k % 2 ? s * 0.42 : s;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = palette.ink;
  ctx.stroke();
}

function drawFx(ctx: CanvasRenderingContext2D, p: Pose, _r: () => number): void {
  switch (p.fx) {
    case 'stars': {
      const t = p.fxPhase;
      star(ctx, -38 + Math.sin(t * 6) * 3, -112 - t * 14, 7, palette.sun);
      star(ctx, 40, -124 + Math.cos(t * 6) * 4 - t * 8, 6, palette.sun);
      star(ctx, 30, -70 - t * 10, 4.5, palette.blossom);
      break;
    }
    case 'sweat': {
      const y = -112 + p.fxPhase * 16;
      ctx.beginPath();
      ctx.moveTo(-28, y - 8);
      ctx.quadraticCurveTo(-21, y + 2, -28, y + 4);
      ctx.quadraticCurveTo(-35, y + 2, -28, y - 8);
      ctx.fillStyle = palette.energy;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = palette.ink;
      ctx.stroke();
      break;
    }
    case 'spark': {
      const s = 5 + p.fxPhase * 3;
      star(ctx, 42 + p.fxPhase * 4, -46, s, palette.sun);
      break;
    }
    case 'none':
      break;
  }
}

/** Builds the placeholder sheet + manifest in exactly the format final art will use. */
export function createPlaceholderCharacter(): LoadedCharacterSprite {
  const clips = Object.values(CLIPS);
  const cols = Math.max(...clips.map((c) => c.frames));
  const rows = clips.length;
  const sheet = createCanvas(cols * FRAME, rows * FRAME, 1);
  const ctx = sheet.ctx;
  (Object.keys(CLIPS) as AnimState[]).forEach((state, si) => {
    const clip = CLIPS[state];
    for (let i = 0; i < clip.frames; i++) {
      ctx.save();
      ctx.translate(i * FRAME, clip.row * FRAME);
      ctx.beginPath();
      ctx.rect(0, 0, FRAME, FRAME);
      ctx.clip();
      ctx.scale(U, U);
      drawFrame(ctx, pose(state, i, clip.frames), 100 + si * 10 + i);
      ctx.restore();
    }
  });

  const manifest: CharacterSpriteManifest = {
    id: 'placeholder-hero',
    image: '(generated)',
    frameWidth: FRAME,
    frameHeight: FRAME,
    pivot: { x: 0.5, y: (160 - FEET_Y) / 160 },
    worldHeight: 128,
    label: 'PLACEHOLDER',
    animations: CLIPS,
  };
  return { manifest, sheet: sheet.canvas };
}
