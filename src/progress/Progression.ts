import type { MasteryRecord, TargetLanguage } from '../learning/types';
import type { Topic } from '../learning/content';
import { vocabKey } from '../learning/Srs';
import { ENERGY_MAX, xpToNext, type BurgerStage, type SaveData } from '../save/schema';

/**
 * XP, levels, growth stages and topic stars (PROGRESSION_SYSTEM §4–§6). Pure functions over save data.
 */

/** XP amounts (PROGRESSION_SYSTEM §4, first draft). */
export const XP = {
  correctFirstTry: 3,
  correctAfterRetry: 1,
  lesson: 15,
  reviewRound: 10,
  questStep: 10,
  topicStar: 40,
} as const;

/** Growth stage for a level (§5.1). */
export function stageForLevel(level: number): BurgerStage {
  if (level >= 15) return 'deluxe';
  if (level >= 10) return 'double';
  if (level >= 5) return 'classic';
  return 'slider';
}

export interface XpResult {
  /** Every level reached by this gain (usually none or one). */
  levels: number[];
  /** Set when a level up changed the growth stage. */
  stage?: BurgerStage;
}

/** Add XP; each level up refills energy (§3) and may grow Lanburger (§5.1). Mutates `d`. */
export function addXp(d: SaveData, amount: number, now = Date.now()): XpResult {
  const s = d.stats;
  const levels: number[] = [];
  s.xp += Math.max(0, Math.round(amount));
  while (s.xp >= xpToNext(s.level)) {
    s.xp -= xpToNext(s.level);
    s.level++;
    levels.push(s.level);
  }
  const res: XpResult = { levels };
  if (levels.length) {
    s.energy = ENERGY_MAX;
    s.energyUpdatedAt = now;
    const stage = stageForLevel(s.level);
    if (stage !== d.burger.stage) {
      d.burger.stage = stage;
      res.stage = stage;
    }
  }
  return res;
}

/**
 * Stars for a topic (§6): ★ every lesson finished; ★★ average Leitner box ≥ 60 % (box 3 of 5);
 * ★★★ every item in box 4 or higher. Boxes are per target language.
 */
export function topicStars(topic: Topic, d: SaveData, lang: TargetLanguage): number {
  if (!d.flags[`topic:${topic.id}`]) return 0;
  const recs = topic.items.map((it) => d.vocabulary[vocabKey(lang, it.id)] as MasteryRecord | undefined);
  const boxes: number[] = recs.map((r) => r?.box ?? 0);
  const avg = boxes.reduce((a, b) => a + b, 0) / (boxes.length * 5);
  if (boxes.every((b) => b >= 4)) return 3;
  if (avg >= 0.6) return 2;
  return 1;
}
