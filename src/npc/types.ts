/**
 * NPC & Quest System contracts (GAME_DESIGN §8, PROGRESSION_SYSTEM §2). Types only until phases R3/R5.
 */

export interface NpcDefinition {
  id: string;
  /** English display name (UI language). */
  name: string;
  mapId: string;
  x: number;
  y: number;
  /** Sprite manifest key. */
  sprite: string;
  /** Portrait manifest key (six expressions). */
  portrait?: string;
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
