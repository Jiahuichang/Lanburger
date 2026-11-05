import * as THREE from 'three';
import { depth, palette, ramps } from '../art/tokens';
import { PixelCanvas, bayer, pixelTexture } from '../art/pixel';
import type { LightPoint } from '../world/map/TileMap';

/**
 * Dusk lighting (ART_DIRECTION §8): a multiplied cool tint over the map, then warm light pools —
 * stepped, dithered glow sprites blended additively.
 * They are drawn into the low-res target, so they stay pixelated like everything else.
 */
export class LightLayer {
  readonly object = new THREE.Group();
  private byLantern = new Map<string, THREE.Mesh>();
  private meshes: { mesh: THREE.Mesh; phase: number; base: number }[] = [];
  private time = 0;

  constructor(lights: LightPoint[], size: { w: number; h: number }, private reducedMotion: boolean, indoor = false) {
    // dusk: multiply the whole map toward a cool violet, then add warm light pools on top
    const tint = new THREE.Mesh(
      new THREE.PlaneGeometry(size.w, size.h),
      new THREE.MeshBasicMaterial({
        color: indoor ? palette.indoorTint : palette.duskTint,
        blending: THREE.MultiplyBlending,
        premultipliedAlpha: true,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    tint.position.set(size.w / 2, -size.h / 2, depth.overlay);
    tint.renderOrder = 5;
    this.object.add(tint);

    for (const [i, l] of lights.entries()) {
      const mat = new THREE.MeshBasicMaterial({
        map: glowTexture(l.radius),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(l.radius * 2, l.radius * 2), mat);
      mesh.position.set(Math.round(l.x), -Math.round(l.y), depth.glow);
      mesh.renderOrder = 10;
      this.object.add(mesh);
      this.meshes.push({ mesh, phase: i * 1.7, base: 0.55 });
      if (l.lanternId) {
        mesh.visible = false;
        this.byLantern.set(l.lanternId, mesh);
      }
    }
  }

  setLanternLit(id: string, lit: boolean): void {
    const m = this.byLantern.get(id);
    if (m) m.visible = lit;
  }

  update(dt: number): void {
    if (this.reducedMotion) return;
    this.time += dt;
    for (const m of this.meshes) {
      // slow, small flicker; quantized so the glow steps rather than shimmers
      const f = Math.round(Math.sin(this.time * 2.1 + m.phase) * 2) / 2;
      (m.mesh.material as THREE.MeshBasicMaterial).opacity = m.base + f * 0.06;
    }
  }

  dispose(): void {
    this.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose?.();
    });
  }
}

const cache = new Map<number, THREE.Texture>();

function glowTexture(radius: number): THREE.Texture {
  let t = cache.get(radius);
  if (t) return t;
  const size = radius * 2;
  const c = new PixelCanvas(size, size);
  const lamp = ramps.lamp;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - radius, (y + 0.5 - radius) * 1.15) / radius;
      if (d >= 1) continue;
      // three stepped rings with dithered edges
      const v = 1 - d + (bayer(x, y) - 0.5) * 0.18;
      if (v > 0.72) c.set(x, y, lamp[1], 150);
      else if (v > 0.42) c.set(x, y, lamp[2], 105);
      else if (v > 0.12) c.set(x, y, lamp[3], 70);
    }
  }
  t = pixelTexture(c.toCanvas());
  cache.set(radius, t);
  return t;
}
