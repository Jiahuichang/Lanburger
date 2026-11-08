import type { TargetLanguage } from '../learning/types';
/**
 * NPC & Quest System contracts (GAME_DESIGN §8, PROGRESSION_SYSTEM §2).
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
  /** A pet standing beside the NPC (to their right). */
  pet?: { kind: 'dog'; name: string; line: string };
  /**
   * Conversations that replace `dialogueId` while a condition holds; the first match wins.
   * `step` is "questId/stepId" (that step is the current one), `questDone` a completed quest id.
   */
  dialogues?: { id: string; flag?: string; step?: string; questDone?: string }[];
  dialogueId: string;
}

/**
 * Step types (PROGRESSION_SYSTEM §2.2). State steps are worked out from save flags, so they can be
 * done in any order and never go backwards; event steps (talk, interact) only count while current.
 *  - talk      talk to NPC `targets[0]` (or `flag` already set)
 *  - interact  use the object `targets[0]` (e.g. "burger-bistro:door")
 *  - explore   walk up to each building in `targets` (flags "explored:<id>")
 *  - visit     enter each map in `targets` (flags "visited:<id>")
 *  - learn     finish each lesson in `targets` (flags "lesson:<id>")
 *  - practice  finish a practice chat for each topic in `targets` (flags "practiced:<id>")
 */
export type QuestStepType = 'talk' | 'interact' | 'explore' | 'visit' | 'learn' | 'practice';

export interface QuestStep {
  id: string;
  type: QuestStepType;
  targets: string[];
  /** English label shown in the quest tracker. */
  description: string;
  /** Talk steps: a save flag that also counts as done (e.g. met before quests existed). */
  flag?: string;
  /** NPC to go to: gets the '!' balloon (or '?' for a turn-in) and the minimap marker. */
  npc?: string;
  /** Building or map id the minimap marker points at when there is no NPC. */
  place?: string;
  /** Reporting back: the NPC shows '?' instead of '!'. */
  turnIn?: boolean;
}

/** Rewards. `unlocks` are "lantern:<topic>", "building:<id>" or "topping:<id>". */
export interface QuestRewards {
  xp: number;
  coins?: number;
  items?: Record<string, number>;
  unlocks?: string[];
}

export interface QuestDefinition {
  id: string;
  kind: 'main' | 'side' | 'building';
  /** English title (UI language). */
  title: string;
  /** One English sentence for the Quests panel. */
  summary: string;
  giverNpcId: string;
  steps: QuestStep[];
  rewards: QuestRewards;
  /**
   * Starts by itself once these quests are complete (and the level is reached). `languages`: only for
   * players learning one of these languages (content that exists in that language only, e.g. Spanish unit 2).
   */
  requires?: { quests?: string[]; level?: number; languages?: TargetLanguage[] };
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'complete';

export interface QuestProgress {
  status: QuestStatus;
  stepIndex: number;
  /** Unused by state steps (they read flags); kept for save compatibility. */
  counters?: string[];
  updatedAt: number;
}
