/**
 * Learning content contracts (LEARNING_SYSTEM §6). Content lives in src/content/learning/, never in
 * code or UI strings:
 *  - a Topic says WHAT is taught (item ids, lessons) and gives meanings in each support language;
 *  - a Pack gives the target-language forms for one topic in one language;
 *  - SupportTexts are the explanation templates in each support language.
 *
 * A topic can have a language-specific version (e.g. Spanish Greetings is a full curriculum unit, R6B,
 * while the other languages keep the shorter shared topic). Both use the same topic id, so lanterns,
 * quests and flags stay language-neutral.
 */
import type { SupportLanguage, TargetLanguage } from './types';

export type ByLang = Record<SupportLanguage, string>;

/** Time of day a greeting belongs to (error-specific feedback). */
export type TimeOfDay = 'morning' | 'afternoon' | 'night';
/** Formal or informal "you" (Spanish tú / usted, SPANISH_CURRICULUM §7-3). */
export type Register = 'tu' | 'usted';
/** What a phrase does in a conversation (error-specific feedback). */
export type SpeechAct = 'greet' | 'farewell' | 'thanks' | 'ask-name' | 'give-name' | 'ask-how' | 'answer-how' | 'ask-back' | 'meet' | 'title';

export interface ItemTags {
  act?: SpeechAct;
  time?: TimeOfDay;
  register?: Register;
}

export interface TopicItem {
  id: string;
  /** What the phrase means, in each support language. {name} is the speaker's name. */
  meaning: ByLang;
  tags?: ItemTags;
  /** A short contrast or usage note shown on the example card. */
  note?: ByLang;
}

/**
 * Dialogue-reply questions: someone says `line` (or, with no line, the player starts the conversation in
 * the `context` situation), good answers are `reply`, and `wrong` lists replies that clearly don't fit
 * (hand-picked so no distractor is accidentally also right). Item ids.
 */
export interface ReplyPair {
  line?: string;
  /** One accepted reply, or several (all count as right). */
  reply: string | string[];
  wrong: string[];
  /** The situation, in each support language (e.g. "4 p.m. at the fountain"). */
  context?: ByLang;
  /** The time of day of the situation: wrong greetings for another time get a specific explanation. */
  time?: TimeOfDay;
  /** The register the situation needs: a tú reply where usted is needed gets a specific explanation. */
  register?: Register;
  /** Show a second accepted reply among the choices, to teach that both work. */
  both?: boolean;
}

export interface LessonDef {
  id: string;
  /** English UI title. */
  title: string;
  items: string[];
  /** Maggie's short explanation of the situation, in each support language. */
  explain: ByLang;
  /** What the player can do after this lesson (shown on the first card). */
  goal?: ByLang;
  /** A short rule shown after the explanation. */
  rule?: ByLang;
  pairs: ReplyPair[];
}

/** A curriculum unit (SPANISH_CURRICULUM §4): a few lessons plus a situation practice with an NPC. */
export interface UnitDef {
  id: string;
  /** Unit number in the syllabus. */
  number: number;
  /** Target-language unit name, e.g. "Saludos". */
  title: string;
  canDo: ByLang;
  lessons: string[];
  /** The practice chat that completes the unit: its flag is "practiced:<practice>". */
  practice: string;
}

/** A practice chat with a townsperson: reply questions from these lessons. */
export interface ChatDef {
  lessons: string[];
  /** Pairs needing this register come first, and the intro mentions it. */
  register?: Register;
  /** At most this many questions (default 4). */
  size?: number;
}

export interface Topic {
  id: string;
  /** English UI name, e.g. "Greetings". */
  name: string;
  items: TopicItem[];
  lessons: LessonDef[];
  units?: UnitDef[];
  /** Practice chats by id. "chat:<topic>" uses the chat named like the topic, or every lesson. */
  chats?: Record<string, ChatDef>;
}

/** CEFR level label for phrases taught above the unit's level (SPANISH_CURRICULUM §7-6). */
export type Level = 'A1' | 'A2';

export interface Form {
  /** Target-language text. {name} is the speaker's name. */
  text: string;
  /** Pronunciation help: romanization (and kana for kanji). */
  reading?: string;
  /** Forms that change with the speaker's grammatical gender (SPANISH_CURRICULUM §7.2). */
  byGender?: { m: string; f: string };
  /** Other ways to say it that also count as right in typed answers. */
  alts?: string[];
  /** Taught above the unit's level (shown as "Common phrase · beyond A1"). */
  level?: Level;
}

/** A sentence with one missing word to choose (fill-blank). */
export interface FillDrill {
  kind: 'fill';
  item: string;
  /** Text around the blank. {name} is the player's name. */
  before: string;
  after: string;
  answer: string;
  options: string[];
  context?: ByLang;
  /** Why a wrong option does not fit, by option. */
  why?: Record<string, ByLang>;
}

/** Put the words of an item in order (order-words). */
export interface OrderDrill {
  kind: 'order';
  item: string;
  /** An extra word that does not belong. */
  decoy?: string;
}

/** Type the item (short typed answer). */
export interface TypeDrill {
  kind: 'type';
  item: string;
  context?: ByLang;
}

export type Drill = FillDrill | OrderDrill | TypeDrill;

export interface Pack {
  topic: string;
  language: TargetLanguage;
  forms: Record<string, Form>;
  /** Language-specific tips per lesson, in each support language. */
  notes: Record<string, ByLang>;
  /** Fill-blank, order and typing drills per lesson. */
  drills?: Record<string, Drill[]>;
  /** Can players type this language on any keyboard (typed answers in lessons and review)? */
  typing?: boolean;
  /** Has a native speaker reviewed this pack? (LEARNING_SYSTEM §6) */
  reviewed: boolean;
}

export interface SupportTexts {
  promptMeaning: string;
  promptTarget: string;
  promptReply: string;
  /** No line: the player speaks first in a situation. */
  promptSituation: string;
  promptListen: string;
  promptFill: string;
  promptOrder: string;
  promptType: string;
  wrongMeaning: string;
  wrongTarget: string;
  wrongReply: string;
  wrongListen: string;
  wrongFill: string;
  /** A wrong reply that belongs to another time of day. */
  mixTime: string;
  /** A tú phrase where usted is needed, and the other way round. */
  mixUsted: string;
  mixTu: string;
  /** A goodbye where a hello is needed, and the other way round. */
  mixFarewell: string;
  mixGreet: string;
  time: Record<TimeOfDay, string>;
  orderHint: string;
  typeAlmost: string;
  typeWrong: string;
  /** Right, with a tip about the written form. */
  tipAccents: string;
  tipMarks: string;
  /** Right, but in the other gender's form. */
  tipGender: string;
  alsoRight: string;
  reveal: string;
  revealOrder: string;
  revealType: string;
  complete: string;
  reviewIntro: string;
  practiceIntro: string;
  outOfEnergy: string;
  /** A townsperson wants to chat with your new phrases ({name}). */
  chatIntro: string;
  /** Extra intro line for a chat in usted. */
  chatUsted: string;
  chatDone: string;
  /** The teacher asks which Spanish forms the player wants. */
  genderAsk: string;
  genderPicked: string;
}

/** Fill {placeholders} in an explanation template. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export type GrammaticalGender = 'm' | 'f';

/** The text of a form for this speaker: gendered forms resolved, {name} filled. */
export function formText(form: Form, gender: GrammaticalGender | null, name: string): string {
  const raw = form.byGender ? form.byGender[gender ?? 'm'] : form.text;
  return raw.replace(/\{name\}/g, name);
}

/** The lessons, units and chats of a topic that a player can see, in order. */
export function lessonIndex(topic: Topic, lessonId: string): number {
  return topic.lessons.findIndex((l) => l.id === lessonId);
}

export function unitOf(topic: Topic, lessonId: string): UnitDef | undefined {
  return topic.units?.find((u) => u.lessons.includes(lessonId));
}
