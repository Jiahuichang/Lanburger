/**
 * Learning System contracts (docs/LEARNING_SYSTEM.md). Types only until phase R4.
 */

/** Languages a player can learn. */
export const TARGET_LANGUAGES = ['en', 'es', 'de', 'ja', 'zh-TW'] as const;
export type TargetLanguage = (typeof TARGET_LANGUAGES)[number];

/** Languages that lesson explanations can be written in (LEARNING_SYSTEM §7, decision #3). */
export const SUPPORT_LANGUAGES = ['en', 'zh-TW'] as const;
export type SupportLanguage = (typeof SUPPORT_LANGUAGES)[number];

/** Every language code the game knows. */
export type LanguageCode = TargetLanguage;

export type LocalizedText = Partial<Record<LanguageCode, string>>;
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type QuestionKind =
  | 'choose-meaning'
  | 'choose-target'
  | 'listen-choose'
  | 'dialogue-reply'
  | 'order-words'
  | 'fill-blank'
  | 'match-pairs';

export interface Choice {
  id: string;
  text: string;
  image?: string;
  audio?: string;
}

export interface Question {
  id: string;
  /** Topic objective id, e.g. "greet.hello". */
  objective: string;
  targetLanguage: TargetLanguage;
  difficulty: Difficulty;
  kind: QuestionKind;
  /** Instruction in the support language. */
  prompt: LocalizedText;
  /** Target-language text displayed large. */
  promptTarget?: string;
  choices: Choice[];
  correctChoiceId: string;
  /** Why the answer is right / the common mistake, in the support language. */
  explanation: LocalizedText;
  audio?: string;
  review: {
    itemIds: string[];
    tags: string[];
    introducedIn?: string;
  };
}

export interface VocabForm {
  text: string;
  reading?: string;
  romanization?: string;
  gender?: 'm' | 'f' | 'n';
  audio?: string;
}

export interface VocabItem {
  id: string;
  concept: string;
  forms: Partial<Record<TargetLanguage, VocabForm>>;
  image?: string;
}

export interface MasteryRecord {
  itemId: string;
  taughtAt?: number;
  box: 0 | 1 | 2 | 3 | 4 | 5;
  dueAt: number;
  correct: number;
  wrong: number;
  lastSeenAt: number;
}

/** The seven steps of a learning encounter (LEARNING_SYSTEM §2). */
export type LearningStage = 'situation' | 'explain' | 'example' | 'exercise' | 'feedback' | 'retry' | 'complete';
