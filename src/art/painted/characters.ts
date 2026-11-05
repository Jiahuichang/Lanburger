/**
 * Character cards as data (ART_DIRECTION §6). Each NPC's look is a ChibiSpec built only from palette
 * ramps. Friend NPCs are added here once their character card is approved — photos never enter the repo.
 */
import { ramps } from '../tokens';
import type { ChibiSpec } from './chibi';

export const CHARACTER_SPECS: Record<string, ChibiSpec> = {
  /** Mayor Bun — silver hair in a bun (hence the name), round glasses, purple coat, gold mayor's sash. */
  'mayor-bun': {
    skin: ramps.skin,
    hair: ramps.slate,
    hairStyle: 'bun',
    outfit: ramps.royal,
    outfitStyle: 'coat',
    trim: ramps.wall,
    legs: ramps.shade,
    shoes: ramps.wood,
    glasses: true,
    sash: true,
  },
};
