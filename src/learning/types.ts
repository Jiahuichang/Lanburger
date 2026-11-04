/**
 * Learning Engine contracts (LEARNING_DESIGN.md). Phase 1 ships types only;
 * the engine itself arrives in Phase 3.
 */

export const LANGUAGES = ['en', 'es', 'de', 'fr', 'zh-TW'] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export type LocalizedText = Partial<Record<LanguageCode, string>>;
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type QuestionKind =
  | 'choose-translation'
  | 'choose-picture'
  | 'listen-choose'
  | 'fill-blank'
  | 'order-words'
  | 'match-pairs';

export interface Choice {
  id: string;
  text: string;
  image?: string;
  audio?: string;
}

export interface Question {
  id: string;
  /** Learning objective id, e.g. "greet.basic". */
  objective: string;
  targetLanguage: LanguageCode;
  difficulty: Difficulty;
  kind: QuestionKind;
  /** Instruction in the UI language. */
  prompt: LocalizedText;
  /** Target-language text displayed large. */
  promptTarget?: string;
  choices: Choice[];
  correctChoiceId: string;
  /** Why the answer is right / the common mistake, in the UI language. */
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
  romanization?: string;
  gender?: 'm' | 'f' | 'n';
  audio?: string;
}

export interface VocabItem {
  id: string;
  concept: string;
  forms: Partial<Record<LanguageCode, VocabForm>>;
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

/** The learning sequence every lesson follows. */
export type LearningStage = 'teach' | 'guided-practice' | 'challenge' | 'feedback' | 'review';
