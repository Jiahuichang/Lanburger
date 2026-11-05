import * as THREE from 'three';
import { depth } from '../art/tokens';
import { PixelCanvas, hash2, pixelTexture } from '../art/pixel';
import { edgeSignature, paintEdge, paintTileAtlas, paintWaterFrames, TILE_VARIANTS } from '../art/painted/tiles';
import { paintBuilding } from '../art/painted/buildings';
import { paintLantern, paintProp } from '../art/painted/props';
import { assets } from '../assets/AssetRegistry';
import type { LightPoint, TileMap } from '../world/map/TileMap';
import type { GroundKind } from '../world/map/types';
import { placeSprite } from './sprites';

const NEIGHBORS: [number, number][] = [
  [0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1],
];
const WATER_FRAME_SECONDS = 0.28;

/**
 * Draws a TileMap: a merged ground mesh, an animated water mesh, a transition-overlay mesh
 * (grass edges, banks, rails), and depth-sorted sprites for props, buildings and Word Lanterns.
 * Presentation only — collision and interaction live in TileMap.
 */
export class TileMapView {
  readonly object = new THREE.Group();
  /** Lights that come from the art itself (lit windows); the scene adds them to the light layer. */
  readonly artLights: LightPoint[] = [];
  private lanterns = new Map<string, { off: THREE.Mesh; on: THREE.Mesh }>();
  private water?: { mesh: THREE.Mesh; frames: THREE.Texture[]; t: number; f: number };

  constructor(private map: TileMap, private reducedMotion = false) {
    this.object.add(this.buildGround());
    const water = this.buildWater();
    if (water) this.object.add(water);
    const edges = this.buildEdges();
    if (edges) this.object.add(edges);

    for (const p of map.props) {
      const s = assets.sprite(`prop.${p.kind}.${(p.seed ?? 0) % 4}`, () => paintProp(p.kind, p.seed ?? 0));
      this.object.add(placeSprite(s.tex, s.w, s.h, s.anchor, p.px, p.py, p.flip));
    }
    for (const b of map.buildings) {
      const s = assets.sprite(`building.${b.id}`, () => paintBuilding(b.style, b.pw, b.name, b.x * 31 + b.y));
      for (const l of s.lights ?? []) this.artLights.push({ x: b.px + l.dx, y: b.py + l.dy, radius: l.radius });
      this.object.add(placeSprite(s.tex, s.w, s.h, s.anchor, b.px, b.py));
    }
    const off = assets.sprite('prop.lantern.off', () => paintLantern(false));
    const on = assets.sprite('prop.lantern.on', () => paintLantern(true));
    for (const l of map.lanterns) {
      const meshOff = placeSprite(off.tex, off.w, off.h, off.anchor, l.px, l.py);
      const meshOn = placeSprite(on.tex, on.w, on.h, on.anchor, l.px, l.py);
      meshOn.visible = false;
      this.object.add(meshOff, meshOn);
      this.lanterns.set(l.id, { off: meshOff, on: meshOn });
    }
  }

  setLanternLit(id: string, lit: boolean): void {
    const l = this.lanterns.get(id);
    if (!l) return;
    l.on.visible = lit;
    l.off.visible = !lit;
  }

  update(dt: number): void {
    const w = this.water;
    if (!w || this.reducedMotion) return;
    w.t += dt;
    if (w.t >= WATER_FRAME_SECONDS) {
      w.t -= WATER_FRAME_SECONDS;
      w.f = (w.f + 1) % w.frames.length;
      (w.mesh.material as THREE.MeshBasicMaterial).map = w.frames[w.f];
    }
  }

  private neighbors(c: number, r: number): GroundKind[] {
    return NEIGHBORS.map(([dx, dy]) => this.map.kindAt(c + dx, r + dy));
  }

  private buildGround(): THREE.Mesh {
    const m = this.map;
    const atlas = assets.sprite('tiles.ground', () => ({ canvas: paintTileAtlas(), anchor: { x: 0, y: 0 } }));
    const quads: Quad[] = [];
    for (let r = 0; r < m.rows; r++) {
      for (let c = 0; c < m.cols; c++) {
        const kind = m.ground[r * m.cols + c];
        const v = Math.floor(hash2(c, r, kind) * TILE_VARIANTS);
        quads.push({ c, r, u: v, v: kind });
      }
    }
    const mesh = new THREE.Mesh(tileGeometry(quads, m.tile, atlas.w, atlas.h), new THREE.MeshBasicMaterial({ map: atlas.tex }));
    mesh.position.z = depth.ground;
    return mesh;
  }

  /** Water tiles get their own mesh so the texture can be swapped for animation. */
  private buildWater(): THREE.Mesh | null {
    const m = this.map;
    const quads: Quad[] = [];
    for (let r = 0; r < m.rows; r++) for (let c = 0; c < m.cols; c++) if (m.kindAt(c, r) === 'water') quads.push({ c, r, u: 0, v: 0 });
    if (!quads.length) return null;
    const frames = paintWaterFrames().map((cv) => pixelTexture(cv));
    const mesh = new THREE.Mesh(tileGeometry(quads, m.tile, m.tile, m.tile), new THREE.MeshBasicMaterial({ map: frames[0] }));
    mesh.position.z = depth.ground + 0.3;
    this.water = { mesh, frames, t: 0, f: 0 };
    return mesh;
  }

  /** Transition overlays, packed into one atlas built from the signatures this map actually uses. */
  private buildEdges(): THREE.Mesh | null {
    const m = this.map;
    const T = m.tile;
    const keys = new Map<string, number>();
    const cells: { c: number; r: number; key: string }[] = [];
    for (let r = 0; r < m.rows; r++) {
      for (let c = 0; c < m.cols; c++) {
        const key = edgeSignature(m.kindAt(c, r), this.neighbors(c, r), Math.floor(hash2(c, r, 7) * 2));
        if (!key) continue;
        if (!keys.has(key)) keys.set(key, keys.size);
        cells.push({ c, r, key });
      }
    }
    if (!cells.length) return null;
    const cols = 16;
    const rows = Math.ceil(keys.size / cols);
    const atlas = new PixelCanvas(cols * T, rows * T);
    for (const [key, i] of keys) atlas.blit(paintEdge(key), (i % cols) * T, Math.floor(i / cols) * T);
    const tex = pixelTexture(atlas.toCanvas());
    const quads = cells.map(({ c, r, key }) => {
      const i = keys.get(key)!;
      return { c, r, u: i % cols, v: Math.floor(i / cols) };
    });
    const mesh = new THREE.Mesh(tileGeometry(quads, T, atlas.w, atlas.h), new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5 }));
    mesh.position.z = depth.groundDetail;
    return mesh;
  }

  dispose(): void {
    this.water?.frames.forEach((t) => t.dispose());
    this.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose?.();
    });
  }
}

/** One map cell (c, r) showing atlas cell (u, v). */
interface Quad {
  c: number;
  r: number;
  u: number;
  v: number;
}

/** Merge many tile quads into one geometry. Map pixels, y down → Three y up. */
function tileGeometry(quads: Quad[], T: number, atlasW: number, atlasH: number): THREE.BufferGeometry {
  const pos = new Float32Array(quads.length * 12);
  const uv = new Float32Array(quads.length * 8);
  const idx = new Uint32Array(quads.length * 6);
  quads.forEach((q, i) => {
    const x0 = q.c * T;
    const y0 = -q.r * T;
    pos.set([x0, y0, 0, x0 + T, y0, 0, x0, y0 - T, 0, x0 + T, y0 - T, 0], i * 12);
    const u0 = (q.u * T) / atlasW;
    const u1 = ((q.u + 1) * T) / atlasW;
    const vTop = 1 - (q.v * T) / atlasH;
    const vBot = 1 - ((q.v + 1) * T) / atlasH;
    uv.set([u0, vTop, u1, vTop, u0, vBot, u1, vBot], i * 8);
    const b = i * 4;
    idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], i * 6);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

