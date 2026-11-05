import type { TargetLanguage } from '../../learning/types';
import type { Pack, Topic } from '../../learning/content';
import { greetings } from './greetings/topic';
import { en } from './greetings/en';
import { es } from './greetings/es';
import { de } from './greetings/de';
import { ja } from './greetings/ja';
import { zhTW } from './greetings/zh-TW';

/** Every topic and language pack, by id. The learning engine looks content up here. */
export const TOPICS: Record<string, Topic> = { [greetings.id]: greetings };

const PACKS: Pack[] = [en, es, de, ja, zhTW];

export function packFor(topic: string, language: TargetLanguage): Pack | undefined {
  return PACKS.find((p) => p.topic === topic && p.language === language);
}
