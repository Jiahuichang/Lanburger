/**
 * Mini-game Framework contracts (MINIGAME_DESIGN §1). Interface only in Phase 1;
 * the framework and Vocabulary Snake arrive in Phase 4.
 */
import type { Scene, ReturnPoint } from '../core/Scene';
import type { Difficulty, LanguageCode } from '../learning/types';

export type MiniGameId = 'snake' | 'cooking' | 'kart';

export interface MiniGameConfig {
  gameId: MiniGameId;
  targetLanguage: LanguageCode;
  uiLanguage: LanguageCode;
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
