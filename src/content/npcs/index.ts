import type { NpcDefinition } from '../../npc/types';

/**
 * Every NPC in the game (WORLD_MAP §2.2). Positions are tiles. Names and lines are English (UI language);
 * learning content will come from content packs in R4.
 */
export const NPCS: NpcDefinition[] = [
  {
    id: 'mayor-bun',
    name: 'Mayor Bun',
    mapId: 'hello-town',
    x: 42.6,
    y: 18.4,
    facing: 'down',
    sprite: 'mayor-bun',
    portrait: 'mayor-bun',
    dialogueId: 'mayor-bun.welcome',
    questHooks: ['welcome-to-hello-town'],
    greeting: "Welcome to Hello Town, Lanburger! Our Word Lanterns have gone dark... Look around, and come back to me soon.",
  },
  {
    id: 'jeremy',
    name: 'Jeremy',
    mapId: 'hello-town',
    x: 63.6,
    y: 39.4,
    facing: 'down',
    sprite: 'jeremy',
    portrait: 'jeremy',
    dialogueId: 'jeremy.smalltalk',
    greeting: "...Oh. Hi. The karts aren't ready yet. I'm tuning them. ...Do you surf?",
  },
  {
    id: 'jonas',
    name: 'Jonas',
    mapId: 'hello-town',
    x: 36.4,
    y: 50.8,
    facing: 'down',
    sprite: 'jonas',
    portrait: 'jonas',
    dialogueId: 'jonas.smalltalk',
    greeting: "Hallo! No trains until the lanterns shine again. Technically, it's a power problem. ...Get it? Power? Okay.",
  },
  {
    id: 'summy',
    name: 'Summy',
    mapId: 'hello-town',
    x: 16.8,
    y: 39.2,
    facing: 'down',
    sprite: 'summy',
    portrait: 'summy',
    dialogueId: 'summy.smalltalk',
    greeting: 'Hi hi! The General Store opens soon. I am sorting the teacups. Aren\'t they so cute?',
  },
];
