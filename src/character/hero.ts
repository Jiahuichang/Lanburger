import type { CharacterSpriteManifest, LoadedCharacterSprite } from './types';
import { HERO_FRAME, paintHeroSheet } from '../art/greybox/lanburger';

/**
 * Lanburger's sprite manifest. This is the ONLY place that knows which art the hero uses
 * (CLAUDE.md rule 3). R1 uses the generated greybox sheet; R2 swaps `image` for the final PNG.
 */
const idleRows = { down: 0, up: 1, right: 2, left: { row: 2, flip: true } } as const;
const walkRows = { down: 3, up: 4, right: 5, left: { row: 5, flip: true } } as const;
const emoteRows = (row: number) => ({ down: row, up: row, left: row, right: row });

export const lanburgerManifest: CharacterSpriteManifest = {
  id: 'lanburger',
  image: 'generated:lanburger-greybox',
  frameWidth: HERO_FRAME.w,
  frameHeight: HERO_FRAME.h,
  anchor: { x: 16, y: 47 },
  shadowWidth: 22,
  animations: {
    idle: { rows: idleRows, frames: 2, fps: 1.6, loop: true },
    walk: { rows: walkRows, frames: 4, fps: 9, loop: true },
    talk: { rows: idleRows, frames: 2, fps: 4, loop: true },
    learn: { rows: idleRows, frames: 2, fps: 1.6, loop: true },
    celebrate: { rows: emoteRows(6), frames: 4, fps: 8, loop: false },
    incorrect: { rows: emoteRows(7), frames: 4, fps: 5, loop: false },
  },
};

let cached: LoadedCharacterSprite | null = null;

export async function loadHeroSprite(): Promise<LoadedCharacterSprite> {
  cached ??= { manifest: lanburgerManifest, sheet: paintHeroSheet() };
  return cached;
}
