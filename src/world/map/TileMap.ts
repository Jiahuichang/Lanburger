import { pixel } from '../../art/tokens';
import type { Facing } from '../../character/types';
import { LANTERN_LIGHT, LANTERN_SOLID, PROP_DEFS } from './propDefs';
import {
  BLOCKING_GROUND,
  GROUND_KINDS,
  type BuildingObject,
  type GroundKind,
  type GroundOp,
  type LanternObject,
  type MapSource,
  type PropObject,
} from './types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Interactable {
  id: string;
  kind: 'sign' | 'door' | 'lantern' | 'npc';
  /** Point the player walks up to (map pixels). */
  x: number;
  y: number;
  radius: number;
  /** Where the prompt floats (map pixels). */
  promptY: number;
  title: string;
  body: string;
  /** For lanterns: the topic name. */
  topicName?: string;
}

export interface LightPoint {
  x: number;
  y: number;
  radius: number;
  /** Lantern lights are switched on by progress; others are always on. */
  lanternId?: string;
}

/** A loaded map in pixel coordinates. Pure data + collision queries; no Three.js. */
export class TileMap {
  readonly id: string;
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly tile = pixel.tile;
  readonly widthPx: number;
  readonly heightPx: number;
  /** Ground kind index per tile (GROUND_KINDS). */
  readonly ground: Uint8Array;
  /** 1 = blocked tile. */
  readonly blocked: Uint8Array;
  readonly solids: Rect[] = [];
  readonly interactables: Interactable[] = [];
  readonly lights: LightPoint[] = [];
  readonly spawns = new Map<string, { x: number; y: number; facing: Facing }>();
  readonly props: (PropObject & { px: number; py: number })[] = [];
  readonly buildings: (BuildingObject & { px: number; py: number; pw: number })[] = [];
  readonly lanterns: (LanternObject & { px: number; py: number })[] = [];
  readonly defaultSpawn: string;

  constructor(src: MapSource) {
    this.id = src.id;
    this.name = src.name;
    this.cols = src.width;
    this.rows = src.height;
    this.widthPx = src.width * this.tile;
    this.heightPx = src.height * this.tile;
    this.defaultSpawn = src.defaultSpawn;

    this.ground = new Uint8Array(this.cols * this.rows).fill(GROUND_KINDS.indexOf(src.base));
    for (const op of src.ground) this.paint(op);
    this.blocked = new Uint8Array(this.cols * this.rows);
    for (let i = 0; i < this.ground.length; i++) {
      this.blocked[i] = BLOCKING_GROUND.includes(GROUND_KINDS[this.ground[i]]) ? 1 : 0;
    }

    const T = this.tile;
    for (const o of src.objects) {
      const px = o.x * T;
      const py = o.y * T;
      switch (o.type) {
        case 'spawn':
          this.spawns.set(o.id, { x: px, y: py, facing: o.facing });
          break;
        case 'prop': {
          this.props.push({ ...o, px, py });
          const def = PROP_DEFS[o.kind];
          if (def.solid) this.solids.push(footRect(px, py, def.solid.w, def.solid.h));
          if (def.light) this.lights.push({ x: px + def.light.dx, y: py + def.light.dy, radius: def.light.radius });
          break;
        }
        case 'sign':
          this.props.push({ type: 'prop', kind: 'sign', x: o.x, y: o.y, px, py });
          this.solids.push(footRect(px, py, PROP_DEFS.sign.solid!.w, PROP_DEFS.sign.solid!.h));
          this.interactables.push({ id: o.id, kind: 'sign', x: px, y: py + 4, radius: 22, promptY: py - 26, title: o.title, body: o.body });
          break;
        case 'lantern':
          this.lanterns.push({ ...o, px, py });
          this.solids.push(footRect(px, py, LANTERN_SOLID.w, LANTERN_SOLID.h));
          this.lights.push({ x: px + LANTERN_LIGHT.dx, y: py + LANTERN_LIGHT.dy, radius: LANTERN_LIGHT.radius, lanternId: o.id });
          this.interactables.push({
            id: o.id,
            kind: 'lantern',
            x: px,
            y: py + 4,
            radius: 20,
            promptY: py - 36,
            title: 'Word Lantern',
            body: '',
            topicName: o.topicName,
          });
          break;
        case 'building': {
          const pw = o.w * T;
          this.buildings.push({ ...o, px, py, pw });
          this.solids.push({ x: px, y: py - o.depth * T, w: pw, h: o.depth * T });
          this.interactables.push({
            id: `${o.id}:door`,
            kind: 'door',
            x: px + pw / 2,
            y: py + 6,
            radius: 20,
            promptY: py - 40,
            title: o.name,
            body: o.blurb,
          });
          break;
        }
      }
    }
  }

  kindAt(col: number, row: number): GroundKind {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return 'forest';
    return GROUND_KINDS[this.ground[row * this.cols + col]];
  }

  isBlockedTile(col: number, row: number): boolean {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return true;
    return this.blocked[row * this.cols + col] === 1;
  }

  /** Does a box (map pixels) overlap any blocked tile or solid? */
  collides(x: number, y: number, w: number, h: number): boolean {
    const T = this.tile;
    const c0 = Math.floor(x / T);
    const c1 = Math.floor((x + w - 0.001) / T);
    const r0 = Math.floor(y / T);
    const r1 = Math.floor((y + h - 0.001) / T);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.isBlockedTile(c, r)) return true;
    for (const s of this.solids) {
      if (x < s.x + s.w && x + w > s.x && y < s.y + s.h && y + h > s.y) return true;
    }
    return false;
  }

  spawn(id?: string): { x: number; y: number; facing: Facing } {
    return this.spawns.get(id ?? this.defaultSpawn) ?? this.spawns.values().next().value ?? { x: this.widthPx / 2, y: this.heightPx / 2, facing: 'down' };
  }

  private paint(op: GroundOp): void {
    const k = GROUND_KINDS.indexOf(op.kind);
    const set = (c: number, r: number) => {
      if (c >= 0 && r >= 0 && c < this.cols && r < this.rows) this.ground[r * this.cols + c] = k;
    };
    if (op.op === 'rect') {
      for (let r = Math.floor(op.y); r < Math.ceil(op.y + op.h); r++) for (let c = Math.floor(op.x); c < Math.ceil(op.x + op.w); c++) set(c, r);
    } else if (op.op === 'ellipse') {
      for (let r = Math.floor(op.cy - op.ry); r <= Math.ceil(op.cy + op.ry); r++) {
        for (let c = Math.floor(op.cx - op.rx); c <= Math.ceil(op.cx + op.rx); c++) {
          const nx = (c + 0.5 - op.cx) / op.rx;
          const ny = (r + 0.5 - op.cy) / op.ry;
          if (nx * nx + ny * ny <= 1) set(c, r);
        }
      }
    } else {
      // thick polyline: every tile whose center is within width/2 of a segment
      const half = op.width / 2;
      for (let i = 0; i < op.points.length - 1; i++) {
        const [ax, ay] = op.points[i];
        const [bx, by] = op.points[i + 1];
        const minC = Math.floor(Math.min(ax, bx) - half - 1);
        const maxC = Math.ceil(Math.max(ax, bx) + half + 1);
        const minR = Math.floor(Math.min(ay, by) - half - 1);
        const maxR = Math.ceil(Math.max(ay, by) + half + 1);
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            if (distToSegment(c + 0.5, r + 0.5, ax, ay, bx, by) <= half) set(c, r);
          }
        }
      }
    }
  }
}

function footRect(x: number, y: number, w: number, h: number): Rect {
  return { x: x - w / 2, y: y - h, w, h };
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
