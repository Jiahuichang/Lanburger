import * as THREE from 'three';
import { depth, ramps } from '../art/tokens';
import { PixelCanvas, pixelTexture } from '../art/pixel';
import type { AnimState, Facing, LoadedCharacterSprite, RowRef } from '../character/types';
import { anchoredQuad, cutoutMaterial, depthFor } from './sprites';

/**
 * Renders any character from a sprite-sheet manifest (4 facings, row flips, foot shadow).
 * Pure presentation: a controller tells it where the character is and what to show.
 */
export class ActorView {
  readonly object = new THREE.Group();
  private body: THREE.Mesh;
  private shadow: THREE.Mesh;
  private tex: THREE.Texture;
  private cols: number;
  private rows: number;
  private state: AnimState = 'idle';
  private facing: Facing = 'down';
  private time = 0;
  private frame = -1;

  constructor(private sprite: LoadedCharacterSprite) {
    const m = sprite.manifest;
    const sheetW = sprite.sheet.width;
    const sheetH = sprite.sheet.height;
    this.cols = Math.round(sheetW / m.frameWidth);
    this.rows = Math.round(sheetH / m.frameHeight);

    this.tex = pixelTexture(sprite.sheet);
    this.tex.repeat.set(1 / this.cols, 1 / this.rows);
    this.body = new THREE.Mesh(anchoredQuad(m.frameWidth, m.frameHeight, m.anchor.x, m.anchor.y), cutoutMaterial(this.tex));
    this.object.add(this.body);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(m.shadowWidth), transparent: true, depthWrite: false }),
    );
    const sw = Math.max(1, m.shadowWidth);
    this.shadow.scale.set(sw, Math.ceil(sw / 3), 1);
    this.shadow.visible = m.shadowWidth > 0;
    this.object.add(this.shadow);
    this.apply();
  }

  get clipFinished(): boolean {
    const clip = this.sprite.manifest.animations[this.state];
    return !clip.loop && this.time * clip.fps >= clip.frames;
  }

  play(state: AnimState, facing: Facing, restart = false): void {
    if (state !== this.state || restart) {
      this.state = state;
      this.time = 0;
      this.frame = -1;
    }
    if (facing !== this.facing) {
      this.facing = facing;
      this.frame = -1;
    }
  }

  /** Place the feet at map pixel (x, y) and advance the animation. */
  update(dt: number, x: number, y: number): void {
    const clip = this.sprite.manifest.animations[this.state];
    this.time += dt;
    let f = Math.floor(this.time * clip.fps);
    f = clip.loop ? f % clip.frames : Math.min(f, clip.frames - 1);
    if (f !== this.frame) {
      this.frame = f;
      this.apply();
    }
    const rx = Math.round(x);
    const ry = Math.round(y);
    this.body.position.set(rx, -ry, depthFor(y));
    this.shadow.position.set(rx, -ry + 1, depth.shadow);
  }

  private apply(): void {
    const clip = this.sprite.manifest.animations[this.state];
    const ref: RowRef = clip.rows[this.facing];
    const row = typeof ref === 'number' ? ref : ref.row;
    const flip = typeof ref !== 'number' && ref.flip;
    const f = Math.max(0, this.frame);
    this.body.scale.x = flip ? -1 : 1;
    this.tex.offset.set(f / this.cols, 1 - (row + 1) / this.rows);
  }

  dispose(): void {
    this.tex.dispose();
    this.body.geometry.dispose();
    (this.body.material as THREE.Material).dispose();
    this.shadow.geometry.dispose();
    (this.shadow.material as THREE.Material).dispose();
  }
}

const shadowCache = new Map<number, THREE.Texture>();

/** A dithered pixel ellipse, drawn semi-transparent under the feet. */
function shadowTexture(width: number): THREE.Texture {
  const w = Math.max(2, width);
  let t = shadowCache.get(w);
  if (!t) {
    const h = Math.max(2, Math.ceil(w / 3));
    const c = new PixelCanvas(w, h);
    c.ellipse(w / 2, h / 2, w / 2, h / 2, ramps.shade[3]);
    for (let i = 3; i < c.data.length; i += 4) if (c.data[i]) c.data[i] = 110;
    t = pixelTexture(c.toCanvas());
    shadowCache.set(w, t);
  }
  return t;
}
