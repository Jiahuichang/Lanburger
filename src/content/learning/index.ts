import type { TargetLanguage } from '../../learning/types';
import type { Pack, Topic } from '../../learning/content';
import { greetings } from './greetings/topic';
import { greetingsEs } from './greetings/es-topic';
import { en } from './greetings/en';
import { es } from './greetings/es';
import { de } from './greetings/de';
import { ja } from './greetings/ja';
import { zhTW } from './greetings/zh-TW';

/** Every topic (the shared version), by id. Lanterns and quests refer to these ids. */
export const TOPICS: Record<string, Topic> = { [greetings.id]: greetings };

/** Language-specific versions of a topic (same id), e.g. Spanish Greetings = syllabus units 1–2 (R6B). */
const LANGUAGE_TOPICS: Partial<Record<TargetLanguage, Record<string, Topic>>> = {
  es: { [greetingsEs.id]: greetingsEs },
};

const PACKS: Pack[] = [en, es, de, ja, zhTW];

/** The version of a topic a learner of `language` studies. */
export function topicFor(topic: string, language: TargetLanguage): Topic | undefined {
  return LANGUAGE_TOPICS[language]?.[topic] ?? TOPICS[topic];
}

/** Every topic id, in order. */
export const TOPIC_IDS = Object.keys(TOPICS);

export function packFor(topic: string, language: TargetLanguage): Pack | undefined {
  return PACKS.find((p) => p.topic === topic && p.language === language);
}
