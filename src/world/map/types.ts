/**
 * Map data format (IMPLEMENTATION_PLAN §4.3, WORLD_MAP §3).
 * Maps are authored as JSON-compatible data: a base ground, a list of ground-painting ops and a list
 * of objects. Every coordinate in a MapSource is in TILES (fractions allowed). The loader converts to
 * pixels. Object positions are the point where the object meets the ground (its foot / front edge).
 */
import type { Facing } from '../../character/types';

export const GROUND_KINDS = ['grass', 'path', 'plaza', 'water', 'bridge', 'forest', 'soil', 'stairs'] as const;
export type GroundKind = (typeof GROUND_KINDS)[number];

/** Ground the player can never stand on. */
export const BLOCKING_GROUND: readonly GroundKind[] = ['water', 'forest'];

export type GroundOp =
  | { op: 'rect'; kind: GroundKind; x: number; y: number; w: number; h: number }
  | { op: 'ellipse'; kind: GroundKind; cx: number; cy: number; rx: number; ry: number }
  | { op: 'path'; kind: GroundKind; points: [number, number][]; width: number };

export const PROP_KINDS = [
  'tree',
  'blossomTree',
  'bush',
  'lamp',
  'bench',
  'flowerBed',
  'flowers',
  'crate',
  'barrel',
  'banner',
  'fountain',
  'rock',
  'sign',
] as const;
export type PropKind = (typeof PROP_KINDS)[number];

export type BuildingStyle = 'townHall' | 'academy' | 'bistro' | 'store' | 'garage' | 'station';

export interface SpawnObject {
  type: 'spawn';
  id: string;
  x: number;
  y: number;
  facing: Facing;
}

export interface PropObject {
  type: 'prop';
  kind: PropKind;
  x: number;
  y: number;
  seed?: number;
  flip?: boolean;
}

export interface BuildingObject {
  type: 'building';
  id: string;
  /** English display name (UI language). */
  name: string;
  /** Short English description shown at the door. */
  blurb: string;
  style: BuildingStyle;
  /** Left edge (tiles). */
  x: number;
  /** Front edge where the building meets the ground (tiles). */
  y: number;
  /** Width in tiles. */
  w: number;
  /** How far the building reaches back from its front edge (tiles) — its collision footprint. */
  depth: number;
}

export interface SignObject {
  type: 'sign';
  id: string;
  x: number;
  y: number;
  title: string;
  body: string;
}

export interface LanternObject {
  type: 'lantern';
  id: string;
  /** Topic whose mastery lights this lantern. */
  topic: string;
  /** English topic name, e.g. "Greetings". */
  topicName: string;
  x: number;
  y: number;
}

export type MapObject = SpawnObject | PropObject | BuildingObject | SignObject | LanternObject;

export interface MapSource {
  id: string;
  /** English name shown in the HUD / minimap. */
  name: string;
  width: number;
  height: number;
  base: GroundKind;
  ground: GroundOp[];
  objects: MapObject[];
  /** Spawn used when the save has no position on this map. */
  defaultSpawn: string;
}
