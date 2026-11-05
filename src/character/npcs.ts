import { EXPRESSIONS, type CharacterSpriteManifest, type LoadedCharacterSprite, type LoadedPortrait, type PortraitManifest } from './types';
import { CHIBI_FRAME, paintChibiPortraits, paintChibiSheet } from '../art/painted/chibi';
import { CHARACTER_SPECS } from '../art/painted/characters';
import { PET_FRAME, paintDogSheet } from '../art/painted/pets';

/**
 * NPC sprite and portrait manifests. Like hero.ts, this is the only place that maps an NPC's
 * sprite key to its art; gameplay code asks for a key and never imports art.
 */
const idleRows = { down: 0, up: 1, right: 2, left: { row: 2, flip: true } } as const;
const walkRows = { down: 3, up: 4, right: 5, left: { row: 5, flip: true } } as const;
const talkRows = { down: 6, up: 1, right: 2, left: { row: 2, flip: true } } as const;

function manifest(id: string): CharacterSpriteManifest {
  return {
    id,
    image: `generated:${id}`,
    frameWidth: CHIBI_FRAME.w,
    frameHeight: CHIBI_FRAME.h,
    anchor: { x: 16, y: 47 },
    shadowWidth: 20,
    animations: {
      idle: { rows: idleRows, frames: 2, fps: 1.4, loop: true },
      walk: { rows: walkRows, frames: 4, fps: 8, loop: true },
      talk: { rows: talkRows, frames: 2, fps: 5, loop: true },
      celebrate: { rows: talkRows, frames: 2, fps: 6, loop: true },
      incorrect: { rows: idleRows, frames: 2, fps: 1.4, loop: true },
      learn: { rows: idleRows, frames: 2, fps: 1.4, loop: true },
    },
  };
}

const sheets = new Map<string, LoadedCharacterSprite>();
const portraits = new Map<string, LoadedPortrait>();

export function hasNpcArt(key: string): boolean {
  return key in CHARACTER_SPECS;
}

export async function loadNpcSprite(key: string): Promise<LoadedCharacterSprite> {
  let s = sheets.get(key);
  if (!s) {
    const spec = CHARACTER_SPECS[key];
    if (!spec) throw new Error(`No art for NPC sprite "${key}"`);
    sheets.set(key, (s = { manifest: manifest(key), sheet: paintChibiSheet(spec) }));
  }
  return s;
}

export async function loadNpcPortrait(key: string): Promise<LoadedPortrait> {
  let p = portraits.get(key);
  if (!p) {
    const spec = CHARACTER_SPECS[key];
    if (!spec) throw new Error(`No portrait for NPC "${key}"`);
    const m: PortraitManifest = {
      id: `${key}.portrait`,
      size: 64,
      expressions: Object.fromEntries(EXPRESSIONS.map((e, i) => [e, i])) as PortraitManifest['expressions'],
    };
    portraits.set(key, (p = { manifest: m, sheet: paintChibiPortraits(spec, EXPRESSIONS) }));
  }
  return p;
}

// ───────────────────────── pets

const petRows = (row: number) => ({ down: row, up: row, right: row, left: { row, flip: true as const } });

const PET_MANIFEST: CharacterSpriteManifest = {
  id: 'pet.dog',
  image: 'generated:pet.dog',
  frameWidth: PET_FRAME.w,
  frameHeight: PET_FRAME.h,
  anchor: { x: 10, y: 15 },
  shadowWidth: 14,
  animations: {
    idle: { rows: petRows(0), frames: 2, fps: 4, loop: true },
    walk: { rows: petRows(1), frames: 4, fps: 10, loop: true },
    talk: { rows: petRows(0), frames: 2, fps: 8, loop: true },
    celebrate: { rows: petRows(0), frames: 2, fps: 8, loop: true },
    incorrect: { rows: petRows(0), frames: 2, fps: 2, loop: true },
    learn: { rows: petRows(0), frames: 2, fps: 4, loop: true },
  },
};

let dogSheet: HTMLCanvasElement | null = null;

export async function loadPetSprite(kind: 'dog'): Promise<LoadedCharacterSprite> {
  void kind;
  dogSheet ??= paintDogSheet();
  return { manifest: PET_MANIFEST, sheet: dogSheet };
}
