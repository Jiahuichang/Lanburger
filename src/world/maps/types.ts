import type { LayerId } from '../../art/tokens';
import type { StringKey } from '../../i18n';
import type { OneWay, Solid } from '../Physics';

export type PropKind =
  | 'signpost' | 'lantern' | 'fence' | 'barrel' | 'crate' | 'flowers' | 'tuft' | 'fern'
  | 'bush' | 'rock' | 'mushroom' | 'tree' | 'cottage' | 'gate' | 'stump';

/**
 * A decorative prop. `x`/`y` are where it appears when the camera is centered on it at rest,
 * whatever its layer — the parallax system converts to layer space.
 */
export interface PropPlacement {
  kind: PropKind;
  layer: LayerId;
  x: number;
  y?: number;
  seed?: number;
  scale?: number;
  flip?: boolean;
  variant?: 'sage' | 'berry' | 'wood';
}

export interface InteractableDef {
  id: string;
  x: number;
  y: number;
  radius: number;
  promptKey: StringKey;
  titleKey: StringKey;
  bodyKey: StringKey;
}

export interface BuntingDef {
  x1: number;
  x2: number;
  y: number;
  seed: number;
}

export interface MapDefinition {
  id: string;
  width: number;
  spawn: { x: number; y: number };
  /** Camera y when the player stands on the ground. */
  restCameraY: number;
  solids: Solid[];
  platforms: OneWay[];
  props: PropPlacement[];
  interactables: InteractableDef[];
  bunting: BuntingDef[];
  /** Points that get a soft additive glow (lanterns). */
  lights: { x: number; y: number }[];
}
