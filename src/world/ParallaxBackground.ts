import * as THREE from 'three';
import { haze, layers, palette, type LayerId } from '../art/tokens';
import { mix } from '../art/color';
import * as art from '../assets/proceduralArt';
import type { MapDefinition, PropPlacement } from './maps/types';
import { colorQuad, spriteMesh } from './sprite';

const BAND_PLANE_W = 7000;

/**
 * Builds and scrolls the layered world from the art-bible layer table (ART_BIBLE §5).
 * Each layer is a Group whose offset = camera × (1 − factor).
 */
export class ParallaxBackground {
  readonly groups = {} as Record<LayerId, THREE.Group>;
  private sky: THREE.Mesh;
  private clouds = new THREE.Group();
  private cloudItems: { mesh: THREE.Mesh; speed: number; baseX: number }[] = [];
  private rays: THREE.Mesh[] = [];
  private glows: THREE.Mesh[] = [];
  private zCounter = new Map<LayerId, number>();
  private time = 0;

  constructor(
    private scene: THREE.Scene,
    private map: MapDefinition,
  ) {
    for (const id of Object.keys(layers) as LayerId[]) {
      const g = new THREE.Group();
      g.name = `layer:${id}`;
      // Three.js sorts by the nearest Group's renderOrder first, so every layer group carries its order.
      g.renderOrder = layers[id].order;
      this.groups[id] = g;
      scene.add(g);
    }

    // Sky follows the camera.
    this.sky = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: art.skyTexture(), depthWrite: false }),
    );
    this.sky.renderOrder = layers.sky.order;
    this.sky.position.z = layers.sky.z;
    scene.add(this.sky);

    this.buildClouds();
    this.buildBands();
    for (const p of map.props) this.addProp(p);
    this.buildPlatforms();
    this.buildBunting();
    this.buildLightsAndRays();
  }

  /** Place a mesh on a layer with stable back-to-front ordering. */
  add(layer: LayerId, mesh: THREE.Object3D, x: number, y: number, zBias = 0): void {
    const L = layers[layer];
    const n = (this.zCounter.get(layer) ?? 0) + 1;
    this.zCounter.set(layer, n);
    // convert "appears-at" coordinates into layer space
    mesh.position.set(x * L.factor, y, L.z + zBias + n * 0.001);
    mesh.traverse((o) => (o.renderOrder = L.order));
    this.groups[layer].add(mesh);
  }

  private buildClouds(): void {
    this.clouds.position.z = layers.sky.z + 2;
    this.scene.add(this.clouds);
    const ys = [400, 330, 450, 360, 420, 300];
    for (let i = 0; i < 6; i++) {
      const c = art.cloud(i + 1);
      const m = spriteMesh(c, { anchor: 'center', opacity: 0.95 });
      const s = 0.7 + (i % 3) * 0.2;
      m.scale.set(s, s, 1);
      m.renderOrder = layers.sky.order + 1;
      const baseX = i * 520 - 400;
      m.position.set(baseX, ys[i], i * 0.01);
      this.clouds.add(m);
      this.cloudItems.push({ mesh: m, speed: 4 + (i % 3) * 3, baseX });
    }
  }

  private bandPlane(layer: LayerId, b: art.Painted, edgeY: number, edgeFromTop: number, filler: string): void {
    const mat = (spriteMesh(b).material as THREE.MeshBasicMaterial);
    b.tex.repeat.set(BAND_PLANE_W / b.w, 1);
    b.tex.needsUpdate = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(BAND_PLANE_W, b.h), mat);
    const group = new THREE.Group();
    mesh.position.y = edgeFromTop - b.h / 2;
    const fill = colorQuad(BAND_PLANE_W, 1400, filler);
    fill.position.y = edgeFromTop - b.h + 1;
    group.add(fill, mesh);
    const L = layers[layer];
    const cx = (this.map.width / 2) * L.factor;
    group.position.set(cx, edgeY, 0);
    this.add(layer, group, 0, edgeY);
    group.position.x = cx;
  }

  private buildBands(): void {
    // far hills (two bands, hazy)
    const farA = art.band({
      key: 'far-a', seed: 3, width: 1024, height: 260, base: 70, amp: 50,
      fill: palette.sageDeep, shade: palette.sageDark, haze: haze.far + 0.12,
      crowns: { count: 22, rMin: 16, rMax: 28 },
    });
    this.bandPlane('far', farA, 300, 70, mix(palette.sageDeep, palette.skyLight, haze.far + 0.12));
    const farB = art.band({
      key: 'far-b', seed: 8, width: 1024, height: 240, base: 60, amp: 40,
      fill: palette.sage, shade: palette.sageDeep, rim: palette.cream, haze: haze.far,
    });
    this.bandPlane('far', farB, 210, 60, mix(palette.sage, palette.skyLight, haze.far));

    // distant tree line
    const tl = art.band({
      key: 'treeline', seed: 12, width: 1024, height: 220, base: 90, amp: 24,
      fill: palette.sageDeep, shade: palette.sageDark, haze: haze.midFar,
      crowns: { count: 14, rMin: 34, rMax: 56 },
    });
    this.bandPlane('midFar', tl, 120, 90, mix(palette.sageDeep, palette.skyLight, haze.midFar));

    // meadow behind the village
    const meadow = art.band({
      key: 'meadow', seed: 21, width: 1024, height: 160, base: 30, amp: 14,
      fill: palette.sage, shade: palette.sageDeep, rim: palette.cream, haze: haze.mid,
    });
    this.bandPlane('mid', meadow, 44, 30, mix(palette.sage, palette.skyLight, haze.mid));

    // ground (play layer)
    const ground = art.groundTile();
    ground.tex.repeat.set((this.map.width + 2400) / ground.w, 1);
    const gm = spriteMesh(ground);
    gm.geometry.dispose();
    gm.geometry = new THREE.PlaneGeometry(this.map.width + 2400, ground.h).translate(0, -ground.h / 2, 0);
    const gGroup = new THREE.Group();
    gm.position.y = art.GROUND_SURFACE;
    const earth = colorQuad(this.map.width + 2400, 1400, palette.earth);
    earth.position.y = art.GROUND_SURFACE - ground.h + 1;
    gGroup.add(earth, gm);
    this.add('play', gGroup, this.map.width / 2, 0, -5);
  }

  private hazeFor(layer: LayerId): number {
    return layer === 'midFar' ? haze.midFar : layer === 'mid' ? haze.mid : 0;
  }

  private addProp(p: PropPlacement): void {
    const h = this.hazeFor(p.layer);
    let painted: art.Painted;
    switch (p.kind) {
      case 'tree': painted = art.bigTree(p.seed ?? 1, h); break;
      case 'cottage': painted = art.cottage(p.seed ?? 1, p.variant ?? 'sage', h); break;
      case 'mushroom': painted = art.giantMushroom(p.seed ?? 1, h); break;
      case 'bush': painted = art.bush(p.seed ?? 1, h); break;
      case 'signpost': painted = art.signpost(); break;
      case 'lantern': painted = art.lanternPost(); break;
      case 'fence': painted = art.fence(p.seed ?? 1); break;
      case 'barrel': painted = art.barrel(); break;
      case 'crate': painted = art.crate(); break;
      case 'flowers': painted = art.flowers(p.seed ?? 0); break;
      case 'tuft': painted = art.grassTuft(p.seed ?? 0); break;
      case 'fern': painted = art.fern(p.seed ?? 0); break;
      case 'rock': painted = art.rock(p.seed ?? 0); break;
      case 'stump': painted = art.stump(); break;
      case 'gate': painted = art.groveGate(); break;
    }
    const m = spriteMesh(painted);
    const s = p.scale ?? 1;
    m.scale.set(p.flip ? -s : s, s, 1);
    // big background trees on the play layer sit behind platforms
    const bias = p.layer === 'play' && p.kind === 'tree' ? -4 : 0;
    this.add(p.layer, m, p.x, p.y ?? 0, bias);
  }

  private buildPlatforms(): void {
    this.map.platforms.forEach((pl, i) => {
      const painted = art.platform(Math.round(pl.w + 16), i + 1);
      const m = spriteMesh(painted);
      // texture surface line sits PLATFORM_SURFACE units below its top
      this.add('play', m, pl.x + pl.w / 2, pl.y - (painted.h - art.PLATFORM_SURFACE), 1);
    });
  }

  private buildBunting(): void {
    for (const b of this.map.bunting) {
      const w = b.x2 - b.x1;
      const m = spriteMesh(art.bunting(Math.round(w), b.seed));
      this.add('play', m, b.x1 + w / 2, b.y - 64 + 8);
    }
  }

  private buildLightsAndRays(): void {
    const glow = { tex: art.glowTexture(), w: 110, h: 110 };
    for (const l of this.map.lights) {
      const g = spriteMesh(glow, { additive: true, anchor: 'center', color: palette.sun, opacity: 0.5 });
      this.add('play', g, l.x, l.y, 3);
      this.glows.push(g);
    }
    const ray = { tex: art.lightRayTexture(), w: 140, h: 720 };
    [300, 1250, 2150, 3000].forEach((x, i) => {
      const r = spriteMesh(ray, { additive: true, anchor: 'center', color: palette.cream, opacity: 0.16 });
      r.rotation.z = -0.32;
      this.add('mid', r, x + i * 40, 300, 5);
      this.rays.push(r);
    });
  }

  /** Scroll layers for camera position (x, y). */
  update(dt: number, camX: number, camY: number, viewW: number, viewH: number): void {
    this.time += dt;
    const restY = this.map.restCameraY;
    for (const id of Object.keys(layers) as LayerId[]) {
      const f = layers[id].factor;
      this.groups[id].position.set(camX * (1 - f), (camY - restY) * (1 - f), 0);
    }
    this.sky.position.set(camX, camY, layers.sky.z);
    this.sky.scale.set(viewW + 4, viewH + 4, 1);

    // clouds: very slow parallax + gentle drift, wrapped around the view
    this.clouds.position.set(camX * 0.94, (camY - restY) * 0.95, layers.sky.z + 2);
    const span = 3120;
    for (const c of this.cloudItems) {
      let x = c.baseX + this.time * c.speed;
      const local = camX * 0.06;
      x = ((((x - local + span / 2) % span) + span) % span) - span / 2 + local;
      c.mesh.position.x = x;
    }

    this.glows.forEach((g, i) => {
      (g.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(this.time * 3 + i * 1.7) * 0.06;
    });
    this.rays.forEach((r, i) => {
      (r.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(this.time * 0.6 + i) * 0.05;
    });
  }
}
