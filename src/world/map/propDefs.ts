import type { PropKind } from './types';

/**
 * Gameplay facts about each prop kind: its collision box at the foot (art pixels).
 * Purely logical — the look of each prop lives in src/art/greybox/.
 */
export interface PropDef {
  /** Collision box centered on the foot point, extending `h` pixels up from it. */
  solid?: { w: number; h: number };
  /** Emits a warm light at this offset from the foot (for the light layer). */
  light?: { dx: number; dy: number; radius: number };
}

export const PROP_DEFS: Record<PropKind, PropDef> = {
  tree: { solid: { w: 12, h: 6 } },
  blossomTree: { solid: { w: 12, h: 6 } },
  bush: { solid: { w: 20, h: 8 } },
  lamp: { solid: { w: 6, h: 4 }, light: { dx: 0, dy: -36, radius: 30 } },
  bench: { solid: { w: 28, h: 6 } },
  flowerBed: { solid: { w: 30, h: 10 } },
  flowers: {},
  crate: { solid: { w: 14, h: 8 } },
  barrel: { solid: { w: 12, h: 6 } },
  banner: { solid: { w: 6, h: 4 } },
  fountain: { solid: { w: 84, h: 34 } },
  rock: { solid: { w: 14, h: 6 } },
  sign: { solid: { w: 10, h: 4 } },
};

/** Word Lanterns are interactable and have a fixed small footprint. */
export const LANTERN_SOLID = { w: 8, h: 4 };
export const LANTERN_LIGHT = { dx: 0, dy: -26, radius: 26 };
