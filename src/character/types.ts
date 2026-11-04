/** Character System contracts — see docs/ASSET_GUIDELINES.md §3. */

export const ANIM_STATES = ['idle', 'walk', 'jump', 'fall', 'interact', 'celebrate', 'incorrect'] as const;
export type AnimState = (typeof ANIM_STATES)[number];

export interface AnimationClip {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

export interface CharacterSpriteManifest {
  id: string;
  /** Sheet path relative to the manifest file (ignored for generated sheets). */
  image: string;
  frameWidth: number;
  frameHeight: number;
  /** Normalized pivot inside a frame (0,0 = bottom-left). Usually bottom-center between the feet. */
  pivot: { x: number; y: number };
  /** World-unit height of one full frame. */
  worldHeight: number;
  /** Optional tag drawn above the character (used for "PLACEHOLDER"). */
  label?: string;
  animations: Record<AnimState, AnimationClip>;
}

/** A manifest plus its decoded sheet, ready for a CharacterView. */
export interface LoadedCharacterSprite {
  manifest: CharacterSpriteManifest;
  sheet: HTMLCanvasElement | HTMLImageElement | ImageBitmap;
}
