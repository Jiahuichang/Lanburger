import * as THREE from 'three';
import type { AnimState, LoadedCharacterSprite } from './types';
import { createCanvas, toTexture } from '../art/painter';
import { palette, motion, fonts } from '../art/tokens';
import { softShadowTexture } from '../assets/proceduralArt';

/**
 * Renders any character from a sprite-sheet manifest. Pure presentation:
 * it never reads input or decides movement — a controller tells it what to show.
 */
export class CharacterView {
  readonly object = new THREE.Group();
  private body = new THREE.Group();
  private mesh: THREE.Mesh;
  private tex: THREE.Texture;
  private cols: number;
  private rows: number;
  private state: AnimState = 'idle';
  private time = 0;
  private frame = -1;
  private speed = 1;
  private squash = 0;
  private squashVel = 0;
  private shadow: THREE.Mesh;
  private label?: THREE.Mesh;
  private labelTime = 0;

  constructor(private sprite: LoadedCharacterSprite) {
    const m = sprite.manifest;
    const clips = Object.values(m.animations);
    this.cols = Math.max(...clips.map((c) => c.frames));
    this.rows = Math.max(...clips.map((c) => c.row)) + 1;

    this.tex = sprite.sheet instanceof HTMLCanvasElement ? toTexture(sprite.sheet) : new THREE.Texture(sprite.sheet);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.premultiplyAlpha = true;
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
    this.tex.repeat.set(1 / this.cols, 1 / this.rows);
    this.tex.needsUpdate = true;

    const h = m.worldHeight;
    const w = h * (m.frameWidth / m.frameHeight);
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate((0.5 - m.pivot.x) * w, (0.5 - m.pivot.y) * h, 0);
    this.mesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, premultipliedAlpha: true, depthWrite: false }),
    );
    this.body.add(this.mesh);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 16),
      new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, premultipliedAlpha: true, depthWrite: false }),
    );
    this.shadow.position.z = -1;
    this.object.add(this.shadow, this.body);

    if (m.label) {
      this.label = makeLabel(m.label);
      this.label.position.set(0, h * (1 - m.pivot.y) - 10, 2);
      this.object.add(this.label);
    }
    this.applyFrame(0);
  }

  get currentState(): AnimState {
    return this.state;
  }

  /** Show a state. Restarts the clip only when the state changes (or `restart` is set). */
  play(state: AnimState, facing: 1 | -1, speed = 1, restart = false): void {
    this.body.scale.x = facing;
    this.speed = speed;
    if (state !== this.state || restart) {
      this.state = state;
      this.time = 0;
      this.frame = -1;
    }
  }

  /** Squash on landing / stretch on take-off (ART_BIBLE §8, ≤ 12 %). */
  impulse(amount: number): void {
    this.squash = Math.max(-motion.maxSquash, Math.min(motion.maxSquash, amount));
    this.squashVel = 0;
  }

  /** Distance from feet to the surface below — drives the contact shadow. */
  setGroundDistance(d: number | null): void {
    if (d === null) {
      this.shadow.visible = false;
      return;
    }
    this.shadow.visible = true;
    this.shadow.position.y = -d + 1;
    const k = Math.max(0.35, 1 - d / 260);
    this.shadow.scale.set(k, k, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = k;
  }

  update(dt: number): void {
    const clip = this.sprite.manifest.animations[this.state];
    this.time += dt * this.speed;
    let f = Math.floor(this.time * clip.fps);
    f = clip.loop ? f % clip.frames : Math.min(f, clip.frames - 1);
    if (f !== this.frame) this.applyFrame(f);

    // critically-damped-ish spring back to neutral scale
    const k = 260;
    const c = 22;
    this.squashVel += (-k * this.squash - c * this.squashVel) * dt;
    this.squash += this.squashVel * dt;
    const sy = 1 - this.squash;
    const sx = 1 + this.squash * 0.8;
    this.body.scale.y = sy;
    this.body.scale.x = Math.sign(this.body.scale.x || 1) * sx;

    if (this.label) {
      this.labelTime += dt;
      this.label.position.y = this.sprite.manifest.worldHeight * (1 - this.sprite.manifest.pivot.y) - 10 + Math.sin(this.labelTime * 2.4) * 2;
    }
  }

  /** True once a non-looping clip has reached its last frame. */
  get clipFinished(): boolean {
    const clip = this.sprite.manifest.animations[this.state];
    return !clip.loop && this.time * clip.fps >= clip.frames;
  }

  private applyFrame(f: number): void {
    this.frame = f;
    const clip = this.sprite.manifest.animations[this.state];
    this.tex.offset.set(f / this.cols, 1 - (clip.row + 1) / this.rows);
  }

  dispose(): void {
    this.tex.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function makeLabel(text: string): THREE.Mesh {
  const h = 22;
  const pad = 10;
  const probe = createCanvas(10, 10).ctx;
  probe.font = fonts.canvas.replace('20px', '13px');
  const w = Math.ceil(probe.measureText(text).width) + pad * 2 + 4;
  const p = createCanvas(w, h + 4);
  const ctx = p.ctx;
  ctx.fillStyle = palette.sun;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 2, 9);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = palette.ink;
  ctx.font = fonts.canvas.replace('20px', '13px');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = toTexture(p.canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h + 4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, premultipliedAlpha: true, depthWrite: false }),
  );
  return mesh;
}
