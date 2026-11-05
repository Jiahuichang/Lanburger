import * as THREE from 'three';
import { layers, palette } from '../art/tokens';
import { glowTexture, leafTexture } from '../assets/proceduralArt';
import { spriteMesh } from './sprite';

const POLLEN = 70;
const LEAVES = 10;

/** Ambient pollen motes + falling leaves around the camera (ART_BIBLE §8). */
export class Particles {
  readonly object = new THREE.Group();
  private points: THREE.Points;
  private seeds: { x: number; y: number; phase: number; speed: number }[] = [];
  private leaves: { mesh: THREE.Mesh; x: number; y: number; vx: number; vy: number; phase: number; spin: number }[] = [];
  private time = 0;
  private material: THREE.PointsMaterial;

  constructor(private reducedMotion: boolean) {
    const pos = new Float32Array(POLLEN * 3);
    for (let i = 0; i < POLLEN; i++) {
      this.seeds.push({ x: Math.random(), y: Math.random(), phase: Math.random() * 10, speed: 0.4 + Math.random() * 0.8 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      map: glowTexture(),
      color: palette.sun,
      size: 8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = layers.fx.order;
    this.object.add(this.points);

    for (let i = 0; i < LEAVES; i++) {
      const m = spriteMesh(leafTexture(i), { anchor: 'center' });
      m.renderOrder = layers.fx.order;
      this.object.add(m);
      this.leaves.push({ mesh: m, x: Math.random(), y: Math.random(), vx: 10 + Math.random() * 14, vy: -(22 + Math.random() * 18), phase: Math.random() * 6, spin: (Math.random() - 0.5) * 2 });
    }
    this.object.position.z = layers.fx.z;
    if (reducedMotion) this.object.visible = false;
  }

  /** Point size is in device pixels; keep it proportional to the view. */
  setPixelScale(pxPerUnit: number): void {
    this.material.size = Math.max(3, 7 * pxPerUnit);
  }

  update(dt: number, camX: number, camY: number, viewW: number, viewH: number): void {
    if (this.reducedMotion) return;
    this.time += dt;
    const W = viewW + 200;
    const H = viewH + 100;
    const left = camX - W / 2;
    const bottom = camY - H / 2;
    const pos = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < POLLEN; i++) {
      const s = this.seeds[i];
      s.y += (dt * s.speed * 14) / H;
      const wx = wrap(s.x * W + Math.sin(this.time * 0.7 + s.phase) * 18 - left, W) + left;
      const wy = wrap(s.y * H - bottom, H) + bottom;
      pos.setXYZ(i, wx, wy, 0);
    }
    pos.needsUpdate = true;
    for (const l of this.leaves) {
      l.x += (l.vx * dt) / W;
      l.y += (l.vy * dt) / H;
      const wx = wrap(l.x * W + Math.sin(this.time * 1.3 + l.phase) * 26 - left, W) + left;
      const wy = wrap(l.y * H - bottom, H) + bottom;
      l.mesh.position.set(wx, wy, 0.1);
      l.mesh.rotation.z = Math.sin(this.time * 1.6 + l.phase) * 0.9 + this.time * l.spin;
    }
  }
}

function wrap(v: number, size: number): number {
  return ((v % size) + size) % size;
}
