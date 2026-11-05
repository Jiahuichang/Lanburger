import { fill, type Form, type LessonDef, type Pack, type SupportTexts, type Topic } from './content';
import type { SupportLanguage, TargetLanguage } from './types';

/**
 * One learning encounter (LEARNING_SYSTEM §2): explain → examples → exercises → feedback/retry → complete.
 * Pure logic: the UI shows `step`, calls `answer()` / `next()`, and the session reports grades and
 * energy costs through callbacks so the save stays outside.
 */
export type Mode = 'lesson' | 'review' | 'practice';

export interface Choice {
  /** Item id this choice stands for. */
  id: string;
  label: string;
  /** Target-language text or support-language meaning (drives font and `lang`). */
  kind: 'target' | 'support';
  reading?: string;
}

export interface Question {
  type: 'meaning' | 'target' | 'reply';
  item: string;
  prompt: string;
  /** Big target-language text shown above the choices (meaning questions). */
  shown?: Form;
  /** What the other person says (reply questions). */
  line?: { speaker: string; form: Form };
  choices: Choice[];
}

export type Step =
  | { kind: 'intro'; text: string; note?: string; alert?: string }
  | { kind: 'example'; item: string; form: Form; meaning: string }
  | { kind: 'question'; q: Question }
  | { kind: 'complete'; items: { form: Form; meaning: string }[]; text: string };

export interface AnswerResult {
  correct: boolean;
  /** Explanation in the support language (wrong answers). */
  explanation?: string;
  /** After two misses the right answer is revealed and is the only choice left. */
  revealed: boolean;
  /** Item ids that may no longer be picked. */
  disabled: string[];
}

export interface SessionOptions {
  mode: Mode;
  topic: Topic;
  pack: Pack;
  target: TargetLanguage;
  support: SupportLanguage;
  texts: SupportTexts;
  /** Lesson to teach (mode 'lesson'). */
  lesson?: LessonDef;
  /** Items to review (modes 'review' / 'practice'). */
  items?: string[];
  /** Who speaks in reply questions. */
  speaker: string;
  rand?: () => number;
  /** First attempt on a question: grade the item for spaced repetition. */
  onGrade?: (item: string, correct: boolean) => void;
  /** A wrong answer that costs energy (lessons only). */
  onMiss?: () => void;
  /** An item was taught (example shown). */
  onTeach?: (item: string) => void;
  /** Extra line for the intro (e.g. out-of-energy notice). */
  introNote?: string;
}

export class LessonSession {
  readonly steps: Step[] = [];
  private i = 0;
  private attempts = 0;
  private disabledIds: string[] = [];
  private solved = false;
  /** Each item is graded once per session (its first question), so one lesson can't jump it several boxes. */
  private gradedItems = new Set<string>();
  private rand: () => number;

  constructor(private o: SessionOptions) {
    this.rand = o.rand ?? Math.random;
    this.build();
  }

  get step(): Step {
    return this.steps[this.i];
  }

  get index(): number {
    return this.i;
  }

  get done(): boolean {
    return this.step.kind === 'complete';
  }

  /** Can the player move on from this step? Questions need a correct answer first. */
  get canAdvance(): boolean {
    return this.step.kind !== 'question' || this.solved;
  }

  get disabled(): string[] {
    return this.disabledIds;
  }

  next(): void {
    if (!this.canAdvance || this.i >= this.steps.length - 1) return;
    this.i++;
    this.attempts = 0;
    this.disabledIds = [];
    this.solved = false;
    const s = this.step;
    if (s.kind === 'example') this.o.onTeach?.(s.item);
  }

  answer(choiceId: string): AnswerResult {
    const s = this.step;
    if (s.kind !== 'question' || this.solved || this.disabledIds.includes(choiceId)) {
      return { correct: false, revealed: false, disabled: this.disabledIds };
    }
    const q = s.q;
    const correct = choiceId === q.item;
    if (this.attempts === 0 && !this.gradedItems.has(q.item)) {
      this.gradedItems.add(q.item);
      this.o.onGrade?.(q.item, correct);
    }
    this.attempts++;
    if (correct) {
      this.solved = true;
      return { correct: true, revealed: false, disabled: this.disabledIds };
    }
    if (this.o.mode === 'lesson') this.o.onMiss?.();
    this.disabledIds = [...this.disabledIds, choiceId];
    const revealed = this.attempts >= 2;
    if (revealed) this.disabledIds = q.choices.map((c) => c.id).filter((id) => id !== q.item);
    return { correct: false, explanation: this.explain(q, choiceId, revealed), revealed, disabled: this.disabledIds };
  }

  // ───────────────────────── building

  private meaning(item: string): string {
    return this.o.topic.items.find((x) => x.id === item)?.meaning[this.o.support] ?? item;
  }

  private form(item: string): Form {
    return this.o.pack.forms[item] ?? { text: item };
  }

  private build(): void {
    const o = this.o;
    const t = o.texts;
    if (o.mode === 'lesson' && o.lesson) {
      const L = o.lesson;
      this.steps.push({ kind: 'intro', text: L.explain[o.support], note: o.pack.notes[L.id]?.[o.support], alert: o.introNote });
      for (const item of L.items) this.steps.push({ kind: 'example', item, form: this.form(item), meaning: this.meaning(item) });
      const qs: Question[] = [];
      for (const item of this.shuffle([...L.items])) qs.push(this.meaningQ(item, L.items));
      for (const item of this.shuffle([...L.items]).slice(0, 2)) qs.push(this.targetQ(item, L.items));
      for (const p of L.pairs) qs.push(this.replyQ(p.line, p.reply, p.wrong));
      for (const q of qs) this.steps.push({ kind: 'question', q });
      this.steps.push({ kind: 'complete', items: L.items.map((id) => ({ form: this.form(id), meaning: this.meaning(id) })), text: fill(t.complete, { n: L.items.length }) });
    } else {
      const items = this.shuffle([...(o.items ?? [])]).slice(0, 6);
      this.steps.push({ kind: 'intro', text: o.mode === 'practice' ? fill(t.practiceIntro, { n: 5 }) : t.reviewIntro, alert: o.introNote });
      items.forEach((item, k) => {
        const q = k % 2 === 0 ? this.meaningQ(item, items) : this.targetQ(item, items);
        this.steps.push({ kind: 'question', q });
      });
      this.steps.push({ kind: 'complete', items: items.map((id) => ({ form: this.form(id), meaning: this.meaning(id) })), text: '' });
    }
    if (this.step.kind === 'example') o.onTeach?.(this.step.item);
  }

  /** Distractors: prefer the given pool, then the rest of the topic. Always 3 choices. */
  private pickChoices(answer: string, pool: string[]): string[] {
    const others = this.shuffle(pool.filter((x) => x !== answer));
    const rest = this.shuffle(this.o.topic.items.map((x) => x.id).filter((x) => x !== answer && !others.includes(x)));
    return this.shuffle([answer, ...[...others, ...rest].slice(0, 2)]);
  }

  private meaningQ(item: string, pool: string[]): Question {
    return {
      type: 'meaning',
      item,
      prompt: this.o.texts.promptMeaning,
      shown: this.form(item),
      choices: this.pickChoices(item, pool).map((id) => ({ id, label: this.meaning(id), kind: 'support' })),
    };
  }

  private targetQ(item: string, pool: string[]): Question {
    return {
      type: 'target',
      item,
      prompt: fill(this.o.texts.promptTarget, { meaning: this.meaning(item) }),
      choices: this.pickChoices(item, pool).map((id) => ({ id, label: this.form(id).text, reading: this.form(id).reading, kind: 'target' })),
    };
  }

  private replyQ(line: string, reply: string, wrong: string[]): Question {
    const ids = this.shuffle([reply, ...this.shuffle([...wrong]).slice(0, 2)]);
    return {
      type: 'reply',
      item: reply,
      prompt: fill(this.o.texts.promptReply, { name: this.o.speaker }),
      line: { speaker: this.o.speaker, form: this.form(line) },
      choices: ids.map((id) => ({ id, label: this.form(id).text, reading: this.form(id).reading, kind: 'target' })),
    };
  }

  private explain(q: Question, chosen: string, revealed: boolean): string {
    const t = this.o.texts;
    const parts: string[] = [];
    if (q.type === 'meaning') {
      parts.push(fill(t.wrongMeaning, { target: this.form(q.item).text, right: this.meaning(q.item), chosen: this.meaning(chosen) }));
    } else if (q.type === 'target') {
      parts.push(fill(t.wrongTarget, { chosen: this.form(chosen).text, chosenMeaning: this.meaning(chosen), meaning: this.meaning(q.item) }));
    } else {
      parts.push(fill(t.wrongReply, { chosen: this.form(chosen).text, chosenMeaning: this.meaning(chosen), line: q.line?.form.text ?? '' }));
    }
    if (revealed) parts.push(fill(t.reveal, { answer: q.type === 'meaning' ? this.meaning(q.item) : this.form(q.item).text, meaning: this.meaning(q.item) }));
    return parts.join(' ');
  }

  private shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
