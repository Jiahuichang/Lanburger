import { palette, ramps } from '../art/tokens';
import type { GroundKind } from '../world/map/types';
import type { TileMap } from '../world/map/TileMap';
import { t } from '../i18n';
import { icons } from './icons';

/** Ground colors on the minimap: the same ramps as the tiles, flattened to one tone each. */
const GROUND: Record<GroundKind, string> = {
  grass: ramps.grass[1],
  path: ramps.stone[1],
  plaza: ramps.plaza[0],
  water: ramps.water[1],
  bridge: ramps.wood[0],
  forest: ramps.foliage[3],
  soil: ramps.soil[1],
  stairs: ramps.stone[0],
  floor: ramps.wood[1],
  wall: ramps.wall[2],
  void: ramps.shade[3],
  rug: ramps.royal[2],
};

const MAX_W = 160;
const MAX_H = 120;

/** A spot marked on the minimap, in map pixels. */
export interface MapMarker {
  x: number;
  y: number;
}

/**
 * The minimap card (reference image, top right): map name, lantern count, the map drawn from its
 * ground data, buildings, lit / dark lanterns, the player and the next quest goal. On short (phone)
 * screens it shows a window that follows the player.
 */
export class Minimap {
  private el: HTMLElement;
  private view: HTMLElement;
  private canvas: HTMLCanvasElement;
  private player: HTMLElement;
  private markers: HTMLElement;
  private map: TileMap | null = null;
  private scale = 2;
  private lit: string[] = [];

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'minimap panel';
    this.el.innerHTML = `
      <div class="minimap-head"><span class="minimap-icon">${icons.pin}</span><span class="minimap-name"></span><span class="minimap-lanterns"></span></div>
      <div class="minimap-view"><div class="minimap-sheet"><canvas></canvas><div class="minimap-markers"></div><i class="minimap-player"></i></div></div>`;
    parent.append(this.el);
    this.view = this.el.querySelector('.minimap-view')!;
    this.canvas = this.el.querySelector('canvas')!;
    this.player = this.el.querySelector('.minimap-player')!;
    this.markers = this.el.querySelector('.minimap-markers')!;
  }

  setVisible(on: boolean): void {
    this.el.classList.toggle('is-hidden', !on);
  }

  /** Draw a map. `lit` lists lit lantern topics; `lanterns` is "n/total" for the head (omit to hide). */
  setMap(map: TileMap, lit: string[], lanterns?: { n: number; total: number }): void {
    this.map = map;
    this.lit = lit;
    this.scale = Math.max(2, Math.min(8, Math.floor(Math.min(MAX_W / map.cols, MAX_H / map.rows))));
    this.el.querySelector('.minimap-name')!.textContent = map.name;
    this.el.setAttribute('aria-label', t('minimap.label', { name: map.name }));
    const lan = this.el.querySelector<HTMLElement>('.minimap-lanterns')!;
    lan.textContent = lanterns ? t('minimap.lanterns', lanterns) : '';
    lan.hidden = !lanterns;
    this.draw();
  }

  /** Re-draw lantern colors after one lights up. */
  setLit(lit: string[], lanterns?: { n: number; total: number }): void {
    this.lit = lit;
    if (lanterns) this.el.querySelector('.minimap-lanterns')!.textContent = t('minimap.lanterns', lanterns);
    this.draw();
  }

  setMarkers(list: MapMarker[]): void {
    const k = this.scale / (this.map?.tile ?? 16);
    const key = list.map((m) => `${Math.round(m.x * k)},${Math.round(m.y * k)}`).join(';');
    if (this.markers.dataset.key === key) return;
    this.markers.dataset.key = key;
    this.markers.innerHTML = list
      .map((m) => `<i class="minimap-goal" style="left:${Math.round(m.x * k)}px;top:${Math.round(m.y * k)}px"></i>`)
      .join('');
  }

  /** Move the player dot (map pixels); on phones the window scrolls to keep it in view. */
  update(x: number, y: number): void {
    const map = this.map;
    if (!map) return;
    const k = this.scale / map.tile;
    const px = Math.round(x * k);
    const py = Math.round(y * k);
    this.player.style.transform = `translate(${px}px, ${py}px)`;
    const vw = this.view.clientWidth;
    const vh = this.view.clientHeight;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ox = cw <= vw ? Math.round((vw - cw) / 2) : -Math.max(0, Math.min(cw - vw, px - Math.round(vw / 2)));
    const oy = ch <= vh ? Math.round((vh - ch) / 2) : -Math.max(0, Math.min(ch - vh, py - Math.round(vh / 2)));
    const pan = `translate(${ox}px, ${oy}px)`;
    if (this.view.dataset.pan !== pan) {
      this.view.dataset.pan = pan;
      this.view.style.setProperty('--pan', pan);
    }
  }

  private draw(): void {
    const map = this.map;
    if (!map) return;
    const S = this.scale;
    const T = map.tile;
    this.canvas.width = map.cols * S;
    this.canvas.height = map.rows * S;
    const ctx = this.canvas.getContext('2d')!;
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        ctx.fillStyle = GROUND[map.kindAt(c, r)];
        ctx.fillRect(c * S, r * S, S, S);
      }
    }
    const px = (v: number) => Math.round((v / T) * S);
    // trees and bushes as dark specks, so the town reads like the real map
    ctx.fillStyle = ramps.foliage[2];
    for (const p of map.props) {
      if (p.kind === 'tree' || p.kind === 'blossomTree' || p.kind === 'bush') ctx.fillRect(px(p.px) - 1, px(p.py) - 2, 2, 2);
    }
    for (const b of map.buildings) {
      const x = px(b.px);
      const w = px(b.pw);
      const h = Math.max(2, Math.round(b.depth * S));
      const y = px(b.py) - h;
      ctx.fillStyle = ramps.wood[3];
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = ramps.roofRed[1];
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = ramps.wall[0];
      ctx.fillRect(x + Math.floor(w / 2) - 1, y + h - 2, 2, 2);
    }
    for (const l of map.lanterns) {
      ctx.fillStyle = palette.ink;
      ctx.fillRect(px(l.px) - 2, px(l.py) - 3, 4, 4);
      ctx.fillStyle = this.lit.includes(l.topic) ? ramps.lamp[1] : ramps.slate[2];
      ctx.fillRect(px(l.px) - 1, px(l.py) - 2, 2, 2);
    }
  }
}
