import type { QuestDefinition, QuestStep } from '../npc/types';
import type { SaveData } from '../save/schema';

/**
 * Quest logic (PROGRESSION_SYSTEM §2). Pure: it reads and updates a SaveData object and reports what
 * changed; it never touches the UI or Three.js. Never blocks (§2.4): no step needs a score, state steps
 * can be done early in any order, and nothing ever moves a quest backwards.
 */

/** Something the player just did that event steps listen for. */
export interface QuestEvent {
  type: 'talk' | 'interact';
  /** NPC id (talk) or interactable id (interact). */
  target: string;
}

export type QuestChange =
  | { kind: 'started'; quest: QuestDefinition }
  | { kind: 'step'; quest: QuestDefinition; step: QuestStep }
  | { kind: 'complete'; quest: QuestDefinition };

const FLAG_PREFIX: Partial<Record<QuestStep['type'], string>> = {
  explore: 'explored:',
  visit: 'visited:',
  learn: 'lesson:',
  practice: 'practiced:',
};

/** How far along a step is, for the tracker ("Explore 3 Locations 1/3"). */
export function stepProgress(step: QuestStep, d: SaveData, current: boolean, done: boolean): { have: number; need: number } {
  const prefix = FLAG_PREFIX[step.type];
  const need = prefix ? step.targets.length : 1;
  if (done) return { have: need, need };
  if (prefix) return { have: step.targets.filter((t) => !!d.flags[`${prefix}${t}`]).length, need };
  return { have: current && step.flag && d.flags[step.flag] ? 1 : 0, need };
}

function stepDone(step: QuestStep, d: SaveData, ev: QuestEvent | undefined): boolean {
  if (FLAG_PREFIX[step.type]) {
    const p = stepProgress(step, d, true, false);
    return p.have >= p.need;
  }
  if (step.flag && d.flags[step.flag]) return true;
  return !!ev && ev.type === (step.type === 'talk' ? 'talk' : 'interact') && step.targets.includes(ev.target);
}

function unlocked(q: QuestDefinition, d: SaveData): boolean {
  const r = q.requires;
  if (!r) return true;
  if (r.level && d.stats.level < r.level) return false;
  if (r.languages && !r.languages.includes(d.profile.targetLanguage)) return false;
  return (r.quests ?? []).every((id) => d.quests[id]?.status === 'complete');
}

/**
 * Start quests whose requirements are met and advance active ones as far as the save allows.
 * `ev` counts for at most one step. Mutates `d`; returns the changes in order.
 */
export function evaluate(defs: QuestDefinition[], d: SaveData, ev?: QuestEvent, now = Date.now()): QuestChange[] {
  const out: QuestChange[] = [];
  let event = ev;
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of defs) {
      let p = d.quests[q.id];
      if (!p) {
        if (!unlocked(q, d)) continue;
        p = d.quests[q.id] = { status: 'active', stepIndex: 0, updatedAt: now };
        out.push({ kind: 'started', quest: q });
        changed = true;
      }
      if (p.status !== 'active') continue;
      while (p.stepIndex < q.steps.length) {
        const step = q.steps[p.stepIndex];
        const usesEvent = !FLAG_PREFIX[step.type] && !(step.flag && d.flags[step.flag]);
        if (!stepDone(step, d, event)) break;
        if (usesEvent) event = undefined;
        p.stepIndex++;
        p.updatedAt = now;
        out.push({ kind: 'step', quest: q, step });
        changed = true;
      }
      if (p.stepIndex >= q.steps.length) {
        p.status = 'complete';
        p.updatedAt = now;
        out.push({ kind: 'complete', quest: q });
        changed = true;
      }
    }
  }
  return out;
}

/** Active quests with their current step. */
export function activeQuests(defs: QuestDefinition[], d: SaveData): { quest: QuestDefinition; step: QuestStep; index: number }[] {
  return defs
    .filter((q) => d.quests[q.id]?.status === 'active')
    .map((q) => {
      const index = Math.min(d.quests[q.id].stepIndex, q.steps.length - 1);
      return { quest: q, step: q.steps[index], index };
    });
}

/** Is "questId/stepId" the current step of an active quest? */
export function isCurrentStep(defs: QuestDefinition[], d: SaveData, ref: string): boolean {
  const [qid, sid] = ref.split('/');
  return activeQuests(defs, d).some((a) => a.quest.id === qid && a.step.id === sid);
}

/** Where the player should go next, for balloons and the minimap (main quest first). */
export interface QuestGoal {
  quest: QuestDefinition;
  step: QuestStep;
  /** NPC to talk to. */
  npc?: string;
  /** Building or map ids to head for (unexplored explore targets, or the step's place). */
  places: string[];
}

export function currentGoals(defs: QuestDefinition[], d: SaveData): QuestGoal[] {
  const order = { main: 0, building: 1, side: 2 } as const;
  return activeQuests(defs, d)
    .sort((a, b) => order[a.quest.kind] - order[b.quest.kind])
    .map(({ quest, step }) => {
      const prefix = FLAG_PREFIX[step.type];
      const places =
        step.place !== undefined
          ? [step.place]
          : step.type === 'explore' && prefix
            ? step.targets.filter((t) => !d.flags[`${prefix}${t}`])
            : [];
      return { quest, step, npc: step.npc, places };
    });
}
