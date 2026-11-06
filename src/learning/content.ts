/**
 * Learning content contracts (LEARNING_SYSTEM §6). Content lives in src/content/learning/, never in
 * code or UI strings:
 *  - a Topic says WHAT is taught (item ids, lessons) and gives meanings in each support language;
 *  - a Pack gives the target-language forms for one topic in one language;
 *  - SupportTexts are the explanation templates in each support language.
 */
import type { SupportLanguage, TargetLanguage } from './types';

export type ByLang = Record<SupportLanguage, string>;

export interface TopicItem {
  id: string;
  /** What the phrase means, in each support language. */
  meaning: ByLang;
}

export interface LessonDef {
  id: string;
  /** English UI title. */
  title: string;
  items: string[];
  /** Maggie's short explanation, in each support language. */
  explain: ByLang;
  /**
   * Dialogue-reply questions: someone says `line`, a good answer is `reply`, and `wrong` lists replies that
   * clearly don't fit (hand-picked so no distractor is accidentally also right). Item ids.
   */
  pairs: { line: string; reply: string; wrong: string[] }[];
}

export interface Topic {
  id: string;
  /** English UI name, e.g. "Greetings". */
  name: string;
  items: TopicItem[];
  lessons: LessonDef[];
}

export interface Form {
  /** Target-language text. */
  text: string;
  /** Pronunciation help: romanization (and kana for kanji). */
  reading?: string;
}

export interface Pack {
  topic: string;
  language: TargetLanguage;
  forms: Record<string, Form>;
  /** Language-specific tips per lesson, in each support language. */
  notes: Record<string, ByLang>;
  /** Has a native speaker reviewed this pack? (LEARNING_SYSTEM §6) */
  reviewed: boolean;
}

export interface SupportTexts {
  promptMeaning: string;
  promptTarget: string;
  promptReply: string;
  wrongMeaning: string;
  wrongTarget: string;
  wrongReply: string;
  reveal: string;
  complete: string;
  reviewIntro: string;
  practiceIntro: string;
  outOfEnergy: string;
  /** A townsperson wants to chat with your new phrases ({name}). */
  chatIntro: string;
  chatDone: string;
}

/** Fill {placeholders} in an explanation template. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
