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
];
