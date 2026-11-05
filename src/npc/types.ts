/**
 * NPC & Quest System contracts (GAME_DESIGN §8, PROGRESSION_SYSTEM §2). Types only until phases R3/R5.
 */

import type { Facing } from '../character/types';

export interface NpcDefinition {
  id: string;
  /** English display name (UI language). */
  name: string;
  mapId: string;
  /** Foot position in tiles (like map objects). */
  x: number;
  y: number;
  /** Sprite manifest key. */
  sprite: string;
  /** Portrait manifest key (six expressions). */
  portrait?: string;
  facing?: Facing;
  /** One English line shown when talked to, until the dialogue system (R3) takes over. */
  greeting?: string;
  /** Conversation used once this save flag is set (e.g. after the first talk). */
  dialogueAfter?: { flag: string; id: string };
  /** How far the NPC strolls from home, in tiles (0 or omitted = stays put). */
  wander?: number;
  /** A save flag that makes the quest balloon '!' turn into small talk '…'. */
  questDoneFlag?: string;
  /** A pet standing beside the NPC (to their right). */
  pet?: { kind: 'dog'; name: string; line: string };
  dialogueId: string;
  questHooks?: string[];
}

export type QuestStepType = 'talk' | 'explore' | 'learn' | 'practice' | 'minigame' | 'deliver' | 'review' | 'count';

export interface QuestStep {
  type: QuestStepType;
  targetId: string;
  /** English label shown in the quest tracker. */
  description: string;
  /** For `count` steps: how many targets complete the step. */
  count?: number;
}

export interface QuestDefinition {
  id: string;
  kind: 'main' | 'side' | 'building';
  /** English title (UI language). */
  title: string;
  giverNpcId: string;
  steps: QuestStep[];
  rewards: { xp: number; coins?: number; items?: Record<string, number>; unlocks?: string[] };
  requires?: { quests?: string[]; level?: number };
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'complete';

export interface QuestProgress {
  status: QuestStatus;
  stepIndex: number;
  /** Progress inside `count` steps (e.g. explored location ids). */
  counters?: string[];
  updatedAt: number;
}
