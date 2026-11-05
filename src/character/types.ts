/** Character System contracts (ART_DIRECTION §5, IMPLEMENTATION_PLAN §2.4). */

export const FACINGS = ['down', 'up', 'left', 'right'] as const;
export type Facing = (typeof FACINGS)[number];

export const ANIM_STATES = ['idle', 'walk', 'talk', 'celebrate', 'incorrect', 'learn'] as const;
export type AnimState = (typeof ANIM_STATES)[number];

/** The six portrait expressions every speaking character has (GAME_DESIGN §8). */
export const EXPRESSIONS = ['neutral', 'happy', 'surprised', 'thinking', 'worried', 'celebrating'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

/** Dialogue / HUD portrait sheet: one square frame per expression, left to right. */
export interface PortraitManifest {
  id: string;
  size: number;
  expressions: Record<Expression, number>;
}

export interface LoadedPortrait {
  manifest: PortraitManifest;
  sheet: HTMLCanvasElement | HTMLImageElement | ImageBitmap;
}

/** Which sheet row a facing uses. `flip` mirrors a row horizontally (e.g. left = mirrored right). */
export type RowRef = number | { row: number; flip: true };

export interface AnimationClip {
  rows: Record<Facing, RowRef>;
  frames: number;
  fps: number;
  loop: boolean;
}

export interface CharacterSpriteManifest {
  id: string;
  /** Sheet path relative to /public (ignored for generated sheets). */
  image: string;
  frameWidth: number;
  frameHeight: number;
  /** Pixel inside a frame that sits on the ground point (usually bottom-center between the feet). */
  anchor: { x: number; y: number };
  /** Foot shadow width in art pixels (0 = none). */
  shadowWidth: number;
  animations: Record<AnimState, AnimationClip>;
}

/** A manifest plus its decoded sheet, ready for an ActorView. */
export interface LoadedCharacterSprite {
  manifest: CharacterSpriteManifest;
  sheet: HTMLCanvasElement | HTMLImageElement | ImageBitmap;
  /** Optional paper-doll overlays on the same frame grid (e.g. Lanburger's toppings), drawn in order. */
  layers?: (HTMLCanvasElement | HTMLImageElement | ImageBitmap)[];
}

export function facingFromVector(x: number, y: number, fallback: Facing): Facing {
  if (x === 0 && y === 0) return fallback;
  if (Math.abs(x) > Math.abs(y) * 1.05) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}

export function facingVector(f: Facing): { x: number; y: number } {
  switch (f) {
    case 'down':
      return { x: 0, y: 1 };
    case 'up':
      return { x: 0, y: -1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
  }
}
