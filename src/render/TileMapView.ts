import * as THREE from 'three';
import { depth } from '../art/tokens';
import { hash2 } from '../art/pixel';
import { paintTileAtlas, TILE_VARIANTS } from '../art/greybox/tiles';
import { paintBuilding } from '../art/greybox/buildings';
import { paintLantern, paintProp } from '../art/greybox/props';
import { assets } from '../assets/AssetRegistry';
import type { TileMap } from '../world/map/TileMap';
import { GROUND_KINDS } from '../world/map/types';
import { placeSprite } from './sprites';

/**
 * Draws a TileMap: one merged ground mesh plus depth-sorted sprites for props, buildings and
 * Word Lanterns. Presentation only — collision and interaction live in TileMap.
 */
export class TileMapView {
  readonly object = new THREE.Group();
  private lanterns = new Map<string, { off: THREE.Mesh; on: THREE.Mesh }>();

  constructor(private map: TileMap) {
    this.object.add(this.buildGround());
    for (const p of map.props) {
      const s = assets.sprite(`prop.${p.kind}.${(p.seed ?? 0) % 4}`, () => paintProp(p.kind, p.seed ?? 0));
      this.object.add(placeSprite(s.tex, s.w, s.h, s.anchor, p.px, p.py, p.flip));
    }
    for (const b of map.buildings) {
      const s = assets.sprite(`building.${b.id}`, () => paintBuilding(b.style, b.pw, b.x * 31 + b.y));
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

  private buildGround(): THREE.Mesh {
    const m = this.map;
    const atlas = assets.sprite('tiles.hello-town', () => ({ canvas: paintTileAtlas(), anchor: { x: 0, y: 0 } }));
    const T = m.tile;
    const n = m.cols * m.rows;
    const pos = new Float32Array(n * 4 * 3);
    const uv = new Float32Array(n * 4 * 2);
    const idx = new Uint32Array(n * 6);
    const aw = atlas.w;
    const ah = atlas.h;
    let q = 0;
    for (let r = 0; r < m.rows; r++) {
      for (let c = 0; c < m.cols; c++, q++) {
        const kind = m.ground[r * m.cols + c];
        const v = Math.floor(hash2(c, r, kind) * TILE_VARIANTS);
        const x0 = c * T;
        const y0 = -r * T;
        const p = q * 12;
        pos.set([x0, y0, 0, x0 + T, y0, 0, x0, y0 - T, 0, x0 + T, y0 - T, 0], p);
        // atlas rows run top→bottom in GROUND_KINDS order; texture v=1 is the canvas top
        const u0 = (v * T) / aw;
        const u1 = ((v + 1) * T) / aw;
        const vTop = 1 - (kind * T) / ah;
        const vBot = 1 - ((kind + 1) * T) / ah;
        uv.set([u0, vTop, u1, vTop, u0, vBot, u1, vBot], q * 8);
        const b = q * 4;
        idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], q * 6);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas.tex }));
    mesh.position.z = depth.ground;
    mesh.name = `ground:${GROUND_KINDS.length}`;
    return mesh;
  }

  dispose(): void {
    this.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material | undefined)?.dispose?.();
    });
  }
}
