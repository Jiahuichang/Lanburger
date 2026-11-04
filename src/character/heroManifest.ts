import { createPlaceholderCharacter } from './placeholderCharacter';
import type { CharacterSpriteManifest, LoadedCharacterSprite } from './types';
import { ANIM_STATES } from './types';

/**
 * Where the protagonist's art comes from.
 * Swap 'placeholder' for '/assets/characters/hero/manifest.json' once the final art is supplied
 * (see docs/ASSET_GUIDELINES.md §3). No gameplay code needs to change.
 */
export const HERO_SOURCE: 'placeholder' | string = 'placeholder';

export async function loadHeroSprite(): Promise<LoadedCharacterSprite> {
  if (HERO_SOURCE === 'placeholder') return createPlaceholderCharacter();
  return loadCharacterSprite(HERO_SOURCE);
}

/** Load any character from a manifest.json + sprite-sheet PNG. */
export async function loadCharacterSprite(manifestUrl: string): Promise<LoadedCharacterSprite> {
  const res = await fetch(manifestUrl);
  if (!res.ok) throw new Error(`Character manifest not found: ${manifestUrl}`);
  const manifest = (await res.json()) as CharacterSpriteManifest;
  for (const s of ANIM_STATES) {
    if (!manifest.animations[s]) throw new Error(`Manifest ${manifest.id} is missing animation "${s}"`);
  }
  const img = new Image();
  img.src = new URL(manifest.image, new URL(manifestUrl, location.href)).href;
  await img.decode();
  return { manifest, sheet: img };
}
