/**
 * Mini-game Framework contracts (docs/MINIGAMES.md §2). Interface only until phase R7.
 * One core per game; villages only supply a MiniGameTheme (data) and topic ids.
 */
import type { Scene, ReturnPoint } from '../core/Scene';
import type { Difficulty, TargetLanguage } from '../learning/types';

export type MiniGameId = 'snake' | 'cooking' | 'kart';

/** Village-specific presentation for one mini-game. Pure data, no logic. */
export interface MiniGameTheme {
  id: string;
  gameId: MiniGameId;
  tileset: string;
  props: Record<string, string>;
  music?: string;
  /** English UI strings, e.g. the mini-game title. */
  strings: Record<string, string>;
}

export interface MiniGameConfig {
  gameId: MiniGameId;
  theme: MiniGameTheme;
  topicIds: string[];
  targetLanguage: TargetLanguage;
  /** Vocabulary ids — must already be taught. */
  itemPool: string[];
  difficulty: Difficulty;
  /** practice = no energy cost, reduced XP, no item drops. Always available. */
  mode: 'normal' | 'practice';
  questId?: string;
  questStepIndex?: number;
  returnPoint: ReturnPoint;
}

export interface MiniGameAnswer {
  questionId: string;
  itemIds: string[];
  correct: boolean;
  ms: number;
}

export interface MiniGameResult {
  gameId: MiniGameId;
  /** false = quit early. Quitting is never penalized. */
  completed: boolean;
  score: number;
  answers: MiniGameAnswer[];
  xpEarned: number;
  itemsEarned: Record<string, number>;
  questStepSatisfied: boolean;
}

export interface MiniGame extends Scene {
  readonly gameId: MiniGameId;
  start(config: MiniGameConfig): void;
  onFinish(cb: (result: MiniGameResult) => void): void;
}
