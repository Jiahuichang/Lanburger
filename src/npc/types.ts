/**
 * NPC & Quest System contracts (GAME_DESIGN §5, §6.4). Types only in Phase 1;
 * implementation arrives in Phases 2–3.
 */
import type { LocalizedText } from '../learning/types';

export interface NpcDefinition {
  id: string;
  name: LocalizedText;
  mapId: string;
  x: number;
  /** Sprite manifest URL or a generated-placeholder id. */
  sprite: string;
  dialogueId: string;
  questHooks?: string[];
}

export type QuestStepType = 'talk' | 'learn' | 'practice' | 'challenge' | 'deliver' | 'review';

export interface QuestStep {
  type: QuestStepType;
  targetId: string;
  description: LocalizedText;
  /** For challenge steps: minimum score to pass. Failing never locks the quest. */
  passScore?: number;
}

export interface QuestDefinition {
  id: string;
  title: LocalizedText;
  giverNpcId: string;
  steps: QuestStep[];
  rewards: { xp: number; acorns?: number; items?: Record<string, number>; unlocks?: string[] };
  requires?: { quests?: string[]; level?: number };
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'complete';

export interface QuestProgress {
  status: QuestStatus;
  stepIndex: number;
  updatedAt: number;
}
