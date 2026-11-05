import type { MasteryRecord, TargetLanguage } from './types';

/**
 * Leitner spaced repetition (LEARNING_SYSTEM §5). Boxes 0–5; a correct first try moves an item up a box,
 * a wrong one sends it back to box 1. Box 0 = just taught (due again in this session).
 */
export const BOX_DAYS = [0, 1, 2, 4, 7, 14] as const;
const DAY = 24 * 60 * 60 * 1000;

export const vocabKey = (lang: TargetLanguage, item: string) => `${lang}:${item}`;

export function taught(rec: MasteryRecord | undefined, item: string, now: number): MasteryRecord {
  if (rec) return { ...rec, lastSeenAt: now };
  return { itemId: item, taughtAt: now, box: 0, dueAt: now, correct: 0, wrong: 0, lastSeenAt: now };
}

export function graded(rec: MasteryRecord, correct: boolean, now: number): MasteryRecord {
  const box = (correct ? Math.min(5, rec.box + 1) : 1) as MasteryRecord['box'];
  return {
    ...rec,
    box,
    dueAt: now + BOX_DAYS[box] * DAY,
    correct: rec.correct + (correct ? 1 : 0),
    wrong: rec.wrong + (correct ? 0 : 1),
    lastSeenAt: now,
  };
}

/** Item ids the player has been taught in this language. */
export function learned(vocab: Record<string, MasteryRecord>, lang: TargetLanguage): string[] {
  const prefix = `${lang}:`;
  return Object.keys(vocab).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
}

/** Taught items that are due now, most overdue first. */
export function due(vocab: Record<string, MasteryRecord>, lang: TargetLanguage, now: number): string[] {
  return learned(vocab, lang)
    .map((id) => ({ id, rec: vocab[vocabKey(lang, id)] }))
    .filter((x) => x.rec.dueAt <= now)
    .sort((a, b) => a.rec.dueAt - b.rec.dueAt)
    .map((x) => x.id);
}
