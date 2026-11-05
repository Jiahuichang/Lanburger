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

  // ── Friend NPCs (character cards approved 2026-11-05; built from consented reference photos kept
  //    privately in references/private/, which is never committed)

  /** Jeremy — Racing Garage mechanic. Tall and slim, tan skin, center-parted black hair, stylish open overshirt. */
  jeremy: {
    skin: ramps.skinTan,
    hair: ramps.hairBlack,
    hairStyle: 'short',
    bangs: 'center',
    outfit: ramps.water,
    outfitStyle: 'overshirt',
    trim: ramps.wall,
    legs: ramps.soil,
    shoes: ramps.slate,
    tall: true,
    prop: 'spinTop',
  },

  /** Jonas — Travel Station master. Very tall, short blond hair, blond mustache, shirt and black shorts, tattoos. */
  jonas: {
    skin: ramps.skinFair,
    hair: ramps.hairBlond,
    hairStyle: 'tousled',
    bangs: 'none',
    outfit: ramps.wall,
    outfitStyle: 'shirt',
    trim: ramps.slate,
    legs: ramps.shade,
    bottoms: 'shorts',
    shoes: ramps.shade,
    tall: true,
    mustache: true,
    tattoos: true,
    prop: 'duck',
  },

  /** Summy — General Store owner. Long curly dark hair with bangs, loose dark tee, her signature pink shoes. */
  summy: {
    skin: ramps.skin,
    hair: ramps.hairBlack,
    hairStyle: 'long',
    bangs: 'full',
    wavy: true,
    outfit: ramps.shade,
    outfitStyle: 'tee',
    trim: ramps.shade,
    legs: ramps.shade,
    shoes: ramps.blossom,
    prop: 'tea',
  },

  /** Maggie — role to be decided. Always smiling (crescent "fox" eyes), long wavy dark hair parted to the side,
   *  black top and a blue skirt, bracelet. */
  maggie: {
    skin: ramps.skin,
    hair: ramps.hairBlack,
    hairStyle: 'long',
    bangs: 'side',
    wavy: true,
    eyes: 'smile',
    outfit: ramps.shade,
    outfitStyle: 'tee',
    trim: ramps.shade,
    legs: ramps.denim,
    bottoms: 'skirt',
    shoes: ramps.wall,
    prop: 'bracelet',
  },
};
