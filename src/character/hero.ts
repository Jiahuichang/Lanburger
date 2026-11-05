import { EXPRESSIONS, type CharacterSpriteManifest, type LoadedCharacterSprite, type LoadedPortrait, type PortraitManifest } from './types';
import { HERO_FRAME, PORTRAIT_SIZE, TOPPINGS, paintHeroPortraits, paintHeroSheet, type BurgerStage, type Topping } from '../art/painted/lanburger';

/**
 * Lanburger's manifests. This is the ONLY place that knows which art the hero uses (CLAUDE.md rule 3).
 * The sheets are painted at runtime; a hand-made PNG can replace them later with the same grid.
 */
const idleRows = { down: 0, up: 1, right: 2, left: { row: 2, flip: true } } as const;
const walkRows = { down: 3, up: 4, right: 5, left: { row: 5, flip: true } } as const;
const talkRows = { down: 6, up: 1, right: 2, left: { row: 2, flip: true } } as const;
const allRows = (row: number) => ({ down: row, up: row, left: row, right: row });

export const lanburgerManifest: CharacterSpriteManifest = {
  id: 'lanburger',
  image: 'generated:lanburger',
  frameWidth: HERO_FRAME.w,
  frameHeight: HERO_FRAME.h,
  anchor: { x: 16, y: 47 },
  shadowWidth: 24,
  animations: {
    idle: { rows: idleRows, frames: 2, fps: 1.6, loop: true },
    walk: { rows: walkRows, frames: 4, fps: 9, loop: true },
    talk: { rows: talkRows, frames: 2, fps: 5, loop: true },
    learn: { rows: allRows(9), frames: 2, fps: 1.6, loop: true },
    celebrate: { rows: allRows(7), frames: 4, fps: 8, loop: false },
    incorrect: { rows: allRows(8), frames: 4, fps: 5, loop: false },
  },
};

export const lanburgerPortraitManifest: PortraitManifest = {
  id: 'lanburger.portrait',
  size: PORTRAIT_SIZE,
  expressions: Object.fromEntries(EXPRESSIONS.map((e, i) => [e, i])) as PortraitManifest['expressions'],
};

export { TOPPINGS, type BurgerStage, type Topping };

const sheets = new Map<string, HTMLCanvasElement>();
const sheet = (stage: BurgerStage, layer: 'base' | Topping) => {
  const key = `${stage}:${layer}`;
  let s = sheets.get(key);
  if (!s) sheets.set(key, (s = paintHeroSheet(stage, layer)));
  return s;
};

/** The hero for a growth stage with the given toppings shown (PROGRESSION_SYSTEM §5). */
export async function loadHeroSprite(stage: BurgerStage = 'slider', toppings: readonly string[] = []): Promise<LoadedCharacterSprite> {
  // draw toppings in stacking order regardless of the order they were earned
  const shown = TOPPINGS.filter((t) => toppings.includes(t));
  return { manifest: lanburgerManifest, sheet: sheet(stage, 'base'), layers: shown.map((t) => sheet(stage, t)) };
}

let portraitSheet: HTMLCanvasElement | null = null;

export async function loadHeroPortrait(): Promise<LoadedPortrait> {
  portraitSheet ??= paintHeroPortraits(EXPRESSIONS);
  return { manifest: lanburgerPortraitManifest, sheet: portraitSheet };
}
