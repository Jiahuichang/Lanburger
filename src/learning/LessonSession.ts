import {
  fill,
  formText,
  type ChatDef,
  type Drill,
  type FillDrill,
  type Form,
  type GrammaticalGender,
  type ItemTags,
  type LessonDef,
  type Level,
  type Pack,
  type Register,
  type ReplyPair,
  type SupportTexts,
  type TimeOfDay,
  type Topic,
} from './content';
import { bestMatch, words } from './answers';
import type { SupportLanguage, TargetLanguage } from './types';

/**
 * One learning encounter (LEARNING_SYSTEM §2, SPANISH_CURRICULUM §6.1): situation and rule → examples →
 * recognition (meaning, target, listening) → building (fill-blank, word order) → producing (typed answers)
 * → using it with someone (replies) → complete. Pure logic: the UI shows `step` and calls `answer()`,
 * `answerOrder()`, `answerText()` or `next()`; grades and energy costs go out through callbacks so the save
 * stays outside.
 */
export type Mode = 'lesson' | 'review' | 'practice' | 'chat';
export type QuestionType = 'meaning' | 'target' | 'reply' | 'listen' | 'fill' | 'order' | 'type';

export interface Choice {
  /** Item id (or option / word id) this choice stands for. */
  id: string;
  label: string;
  /** Target-language text or support-language meaning (drives font and `lang`). */
  kind: 'target' | 'support';
  reading?: string;
}

export interface Question {
  type: QuestionType;
  /** The item graded for spaced repetition. */
  item: string;
  prompt: string;
  /** The situation, in the support language. */
  context?: string;
  /** Big target-language text shown above the choices (meaning questions). */
  shown?: Form;
  /** What the other person says (reply questions). */
  line?: { speaker: string; form: Form };
  /** Choices (meaning, target, reply, listen, fill) or the word bank (order). */
  choices: Choice[];
  /** Choice ids that count as right. */
  accepted: string[];
  /** Text to play (listening questions). */
  listen?: string;
  /** Fill-blank: the sentence around the gap. */
  sentence?: { before: string; after: string };
  /** Order and typing: the expected answer, in full. */
  answer?: string;
  register?: Register;
  time?: TimeOfDay;
}

export type Step =
  | { kind: 'intro'; text: string; goal?: string; rule?: string; note?: string; alert?: string; unit?: string }
  | { kind: 'example'; item: string; form: Form; meaning: string; note?: string; level?: Level }
  | { kind: 'gender'; text: string; options: { id: GrammaticalGender; word: string }[]; picked?: GrammaticalGender; confirm?: string }
  | { kind: 'question'; q: Question }
  | { kind: 'complete'; items: { form: Form; meaning: string }[]; text: string };

export interface AnswerResult {
  correct: boolean;
  /** Explanation in the support language (wrong answers). */
  explanation?: string;
  /** A tip shown with a right answer (other right answers, the written form). */
  tip?: string;
  /** A near miss: no penalty, try again. */
  almost?: boolean;
  /** After two misses the right answer is revealed and is the only choice left. */
  revealed: boolean;
  /** Choice ids that may no longer be picked. */
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
  /** Unit heading for the first card, e.g. "Unit 1 · Saludos". */
  unitLabel?: string;
  /** Items to review (modes 'review' / 'practice'). */
  items?: string[];
  /** Leitner box per item: review questions get harder as an item climbs (SPANISH_CURRICULUM §6.2). */
  boxes?: Record<string, number>;
  /** The practice chat (mode 'chat'). */
  chat?: ChatDef;
  /** Who speaks in reply questions. */
  speaker: string;
  /** The player's name, for {name}. */
  playerName: string;
  /** The player's grammatical gender (null = not chosen yet: the lesson asks before a gendered word). */
  gender: GrammaticalGender | null;
  /** Can the device speak the target language? (listening questions) */
  audio: boolean;
  rand?: () => number;
  /** First attempt on a question: grade the item for spaced repetition. */
  onGrade?: (item: string, correct: boolean) => void;
  /** A question was answered correctly (`firstTry`: with no miss), for XP. */
  onSolve?: (firstTry: boolean) => void;
  /** A wrong answer that costs energy (lessons only). */
  onMiss?: () => void;
  /** An item was taught (example shown). */
  onTeach?: (item: string) => void;
  /** The player picked their Spanish forms. */
  onGender?: (g: GrammaticalGender) => void;
  /** Extra line for the intro (e.g. out-of-energy notice). */
  introNote?: string;
}

export class LessonSession {
  readonly steps: Step[] = [];
  private i = 0;
  private attempts = 0;
  private disabledIds: string[] = [];
  private solved = false;
  private revealedNow = false;
  /** Each item is graded once per session (its first question), so one lesson can't jump it several boxes. */
  private gradedItems = new Set<string>();
  private rand: () => number;
  private gender: GrammaticalGender | null;

  constructor(private o: SessionOptions) {
    this.rand = o.rand ?? Math.random;
    this.gender = o.gender;
    this.steps.push(...this.build());
    if (this.step.kind === 'example') o.onTeach?.(this.step.item);
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

  /** Can the player move on from this step? Questions need a correct answer, the forms question a pick. */
  get canAdvance(): boolean {
    const s = this.step;
    if (s.kind === 'question') return this.solved;
    if (s.kind === 'gender') return !!s.picked;
    return true;
  }

  get disabled(): string[] {
    return this.disabledIds;
  }

  /** Has the answer of the current question been revealed (two misses)? */
  get revealed(): boolean {
    return this.revealedNow;
  }

  next(): void {
    if (!this.canAdvance || this.i >= this.steps.length - 1) return;
    this.i++;
    this.attempts = 0;
    this.disabledIds = [];
    this.solved = false;
    this.revealedNow = false;
    const s = this.step;
    if (s.kind === 'example') this.o.onTeach?.(s.item);
  }

  /** The forms question: remember the pick and rebuild the cards after it with the chosen forms. */
  pickGender(g: GrammaticalGender): void {
    const s = this.step;
    if (s.kind !== 'gender') return;
    this.gender = g;
    this.o.onGender?.(g);
    const fresh = this.build(true);
    this.steps.splice(this.i + 1, this.steps.length, ...fresh.slice(this.i + 1));
    s.picked = g;
    s.confirm = fill(this.o.texts.genderPicked, { word: s.options.find((x) => x.id === g)?.word ?? '' });
  }

  /** A choice question (meaning, target, reply, listen, fill). */
  answer(choiceId: string): AnswerResult {
    const s = this.step;
    if (s.kind !== 'question' || this.solved || this.disabledIds.includes(choiceId) || s.q.type === 'order' || s.q.type === 'type') {
      return this.none();
    }
    const q = s.q;
    const correct = q.accepted.includes(choiceId);
    this.gradeFirst(correct && q.type === 'reply' ? choiceId : q.item, correct);
    this.attempts++;
    if (correct) {
      this.solve();
      return { correct: true, tip: this.alsoRight(q, choiceId), revealed: false, disabled: this.disabledIds };
    }
    this.miss();
    this.disabledIds = [...this.disabledIds, choiceId];
    const revealed = this.attempts >= 2;
    if (revealed) {
      this.revealedNow = true;
      this.disabledIds = q.choices.map((c) => c.id).filter((id) => !q.accepted.includes(id));
    }
    return { correct: false, explanation: this.explain(q, choiceId, revealed), revealed, disabled: this.disabledIds };
  }

  /** An order-words question: the word ids in the order the player put them. */
  answerOrder(ids: string[]): AnswerResult {
    const s = this.step;
    if (s.kind !== 'question' || s.q.type !== 'order' || this.solved) return this.none();
    const q = s.q;
    const label = (id: string) => q.choices.find((c) => c.id === id)?.label ?? '';
    const built = ids.map(label).join(' ');
    const expected = words(q.answer ?? '').join(' ');
    const correct = built === expected;
    this.gradeFirst(q.item, correct);
    this.attempts++;
    if (correct) {
      this.solve();
      return { correct: true, revealed: false, disabled: [] };
    }
    this.miss();
    const t = this.o.texts;
    const revealed = this.attempts >= 2;
    if (revealed) this.revealedNow = true;
    const decoy = q.choices.find((c) => c.id === 'decoy');
    const parts: string[] = [];
    if (decoy && ids.includes('decoy')) parts.push(fill(t.wrongFill, { chosen: decoy.label }));
    parts.push(revealed ? fill(t.revealOrder, { answer: q.answer ?? '' }) : fill(t.orderHint, { first: words(q.answer ?? '')[0] ?? '' }));
    return { correct: false, explanation: parts.join(' '), revealed, disabled: [] };
  }

  /** A typed answer. */
  answerText(input: string): AnswerResult {
    const s = this.step;
    if (s.kind !== 'question' || s.q.type !== 'type' || this.solved || !input.trim()) return this.none();
    const q = s.q;
    const t = this.o.texts;
    const form = this.o.pack.forms[q.item];
    const mine = q.answer ?? '';
    const accepted = [mine, ...this.alts(q.item)];
    const other = form?.byGender && this.gender ? formText(form, this.gender === 'm' ? 'f' : 'm', this.o.playerName) : undefined;
    const best = bestMatch(input, other ? [...accepted, other] : accepted);
    const m = best.match.kind;
    if (m === 'almost') return { correct: false, almost: true, explanation: t.typeAlmost, revealed: this.revealedNow, disabled: [] };
    const correct = m !== 'wrong';
    this.gradeFirst(q.item, correct);
    this.attempts++;
    if (correct) {
      this.solve();
      const shown = best.answer.includes('{name}') ? mine : best.answer;
      let tip: string | undefined;
      if (other && best.answer === other) tip = fill(t.tipGender, { chosen: bareEnd(other), mine: this.gender === 'f' ? '-a' : '-o', answer: bareEnd(mine) });
      else if (m === 'accents') tip = fill(t.tipAccents, { answer: shown });
      else if (m === 'marks') tip = fill(t.tipMarks, { answer: shown });
      return { correct: true, tip, revealed: false, disabled: [] };
    }
    this.miss();
    const revealed = this.attempts >= 2;
    if (revealed) this.revealedNow = true;
    return {
      correct: false,
      explanation: revealed ? fill(t.revealType, { answer: mine }) : fill(t.typeWrong, { meaning: this.meaning(q.item) }),
      revealed,
      disabled: [],
    };
  }

  // ───────────────────────── answering helpers

  private none(): AnswerResult {
    return { correct: false, revealed: this.revealedNow, disabled: this.disabledIds };
  }

  private gradeFirst(item: string, correct: boolean): void {
    if (this.attempts === 0 && !this.gradedItems.has(item)) {
      this.gradedItems.add(item);
      this.o.onGrade?.(item, correct);
    }
  }

  private solve(): void {
    this.solved = true;
    this.o.onSolve?.(this.attempts === 1);
  }

  private miss(): void {
    if (this.o.mode === 'lesson') this.o.onMiss?.();
  }

  private alsoRight(q: Question, picked: string): string | undefined {
    if (q.type !== 'reply') return undefined;
    const others = q.accepted.filter((id) => id !== picked).map((id) => `“${this.text(id)}”`);
    return others.length ? fill(this.o.texts.alsoRight, { list: others.join(', ') }) : undefined;
  }

  private explain(q: Question, chosen: string, revealed: boolean): string {
    const t = this.o.texts;
    const parts: string[] = [];
    if (q.type === 'meaning') {
      parts.push(fill(t.wrongMeaning, { target: this.text(q.item), right: this.meaning(q.item), chosen: this.meaning(chosen) }));
    } else if (q.type === 'fill') {
      const why = this.drillFor(q)?.why?.[chosen]?.[this.o.support];
      parts.push(why ?? fill(t.wrongFill, { chosen }));
    } else {
      const mix = this.mixUp(q, chosen);
      if (mix) parts.push(mix);
      else if (q.type === 'target') parts.push(fill(t.wrongTarget, { chosen: this.text(chosen), chosenMeaning: this.meaning(chosen), meaning: this.meaning(q.item) }));
      else if (q.type === 'listen') parts.push(fill(t.wrongListen, { chosen: this.text(chosen) }));
      else parts.push(fill(t.wrongReply, { chosen: this.text(chosen), chosenMeaning: this.meaning(chosen), line: q.line?.form.text ?? q.context ?? '' }));
    }
    if (revealed) {
      const answer = q.type === 'meaning' ? this.meaning(q.item) : q.type === 'fill' ? (q.accepted[0] ?? '') : this.text(q.accepted[0] ?? q.item);
      parts.push(fill(t.reveal, { answer, meaning: this.meaning(q.item) }));
    }
    return parts.join(' ');
  }

  /** Error-specific feedback: the wrong register, the wrong time of day, or goodbye for hello. */
  private mixUp(q: Question, chosen: string): string | undefined {
    const t = this.o.texts;
    const got = this.tags(chosen);
    const need = this.tags(q.accepted[0] ?? q.item);
    const register = q.register ?? need.register;
    const time = q.time ?? need.time;
    const vars = { chosen: this.text(chosen) };
    if (register && got.register && got.register !== register) return fill(register === 'usted' ? t.mixUsted : t.mixTu, vars);
    if (time && got.time && got.time !== time) return fill(t.mixTime, { ...vars, chosenTime: t.time[got.time], time: t.time[time] });
    if (need.act === 'greet' && got.act === 'farewell') return fill(t.mixFarewell, vars);
    if (need.act === 'farewell' && got.act === 'greet') return fill(t.mixGreet, vars);
    return undefined;
  }

  private drillFor(q: Question): FillDrill | undefined {
    const all = Object.values(this.o.pack.drills ?? {}).flat();
    return all.find((d): d is FillDrill => d.kind === 'fill' && d.item === q.item && d.answer === q.accepted[0]);
  }

  // ───────────────────────── content lookups

  private tags(item: string): ItemTags {
    return this.o.topic.items.find((x) => x.id === item)?.tags ?? {};
  }

  /** Meaning in the support language; {name} is the player. */
  private meaning(item: string, name = this.o.playerName): string {
    return (this.o.topic.items.find((x) => x.id === item)?.meaning[this.o.support] ?? item).replace(/\{name\}/g, name);
  }

  private sup(text: string | undefined): string | undefined {
    return text?.replace(/\{name\}/g, this.o.playerName);
  }

  /** Target text said by `name` (the player unless given), in the player's forms. */
  private text(item: string, name = this.o.playerName): string {
    const f = this.o.pack.forms[item];
    return f ? formText(f, this.gender, name) : item;
  }

  private form(item: string, name = this.o.playerName): Form {
    const f = this.o.pack.forms[item];
    return { text: this.text(item, name), reading: f?.reading, level: f?.level };
  }

  private alts(item: string): string[] {
    return this.o.pack.forms[item]?.alts ?? [];
  }

  private gendered(item: string): boolean {
    return !!this.o.pack.forms[item]?.byGender;
  }

  // ───────────────────────── building

  /** All the steps. `asked`: the forms question was already shown (rebuilding after it). */
  private build(asked = false): Step[] {
    const o = this.o;
    const t = o.texts;
    const steps: Step[] = [];
    if (o.mode === 'lesson' && o.lesson) {
      const L = o.lesson;
      steps.push({
        kind: 'intro',
        text: this.sup(L.explain[o.support])!,
        goal: this.sup(L.goal?.[o.support]),
        rule: this.sup(L.rule?.[o.support]),
        note: o.pack.notes[L.id]?.[o.support],
        alert: o.introNote,
        unit: o.unitLabel,
      });
      for (const item of L.items) {
        if (this.gendered(item) && (asked || this.gender === null) && !steps.some((s) => s.kind === 'gender')) {
          steps.push({ kind: 'gender', text: t.genderAsk, options: (['m', 'f'] as const).map((g) => ({ id: g, word: bareEnd(formText(o.pack.forms[item], g, o.playerName)) })) });
        }
        const it = o.topic.items.find((x) => x.id === item);
        steps.push({ kind: 'example', item, form: this.form(item), meaning: this.meaning(item), note: this.sup(it?.note?.[o.support]), level: o.pack.forms[item]?.level });
      }
      for (const q of this.lessonQuestions(L)) steps.push({ kind: 'question', q });
      steps.push({ kind: 'complete', items: L.items.map((id) => ({ form: this.form(id), meaning: this.meaning(id) })), text: fill(t.complete, { n: L.items.length }) });
    } else if (o.mode === 'chat') {
      // a townsperson tries your new phrases: reply questions from the chat's lessons
      const chat = o.chat ?? { lessons: o.topic.lessons.map((l) => l.id) };
      let pairs = o.topic.lessons.filter((l) => chat.lessons.includes(l.id)).flatMap((l) => l.pairs);
      if (chat.register) pairs = pairs.filter((p) => !p.register || p.register === chat.register);
      const first = this.shuffle(pairs.filter((p) => chat.register && p.register === chat.register));
      const rest = this.shuffle(pairs.filter((p) => !first.includes(p)));
      const picked = [...first, ...rest].slice(0, chat.size ?? 4);
      const intro = fill(t.chatIntro, { name: o.speaker }) + (chat.register === 'usted' ? ` ${fill(t.chatUsted, { name: o.speaker })}` : '');
      steps.push({ kind: 'intro', text: intro, alert: o.introNote });
      for (const p of this.shuffle(picked)) steps.push({ kind: 'question', q: this.replyQ(p) });
      const items = [...new Set(picked.flatMap((p) => [p.reply].flat().slice(0, 1)))];
      steps.push({ kind: 'complete', items: items.map((id) => ({ form: this.form(id), meaning: this.meaning(id) })), text: fill(t.chatDone, { name: o.speaker }) });
    } else {
      const items = this.shuffle([...(o.items ?? [])]).slice(0, 6);
      steps.push({ kind: 'intro', text: o.mode === 'practice' ? fill(t.practiceIntro, { n: 5 }) : t.reviewIntro, alert: o.introNote });
      items.forEach((item, k) => steps.push({ kind: 'question', q: this.reviewQ(item, items, k) }));
      steps.push({ kind: 'complete', items: items.map((id) => ({ form: this.form(id), meaning: this.meaning(id) })), text: '' });
    }
    return steps;
  }

  /** §6.1 stages 2–7: recognition, then building, then typing, then using it with someone. */
  private lessonQuestions(L: LessonDef): Question[] {
    const o = this.o;
    const recognise: Question[][] = [
      this.shuffle([...L.items]).map((item) => this.meaningQ(item, L.items)),
      this.shuffle([...L.items]).slice(0, 2).map((item) => this.targetQ(item, L.items)),
      o.audio ? this.shuffle([...L.items]).slice(0, Math.min(2, L.items.length - 1)).map((item) => this.listenQ(item, L.items)) : [],
    ];
    const drills = o.pack.drills?.[L.id] ?? [];
    const build = drills.filter((d) => d.kind !== 'type').map((d) => this.drillQ(d));
    const produce = o.pack.typing ? drills.filter((d) => d.kind === 'type').map((d) => this.drillQ(d)) : [];
    const use = L.pairs.map((p) => this.replyQ(p));
    return [...interleave(recognise), ...build, ...produce, ...use];
  }

  /** Review gets harder as an item climbs the boxes (SPANISH_CURRICULUM §6.2). */
  private reviewQ(item: string, pool: string[], k: number): Question {
    const box = this.o.boxes?.[item] ?? 0;
    if (box >= 4) {
      if (this.o.pack.typing) return this.typeQ(item);
      const pair = this.o.topic.lessons.flatMap((l) => l.pairs).find((p) => [p.reply].flat().includes(item));
      if (pair) return this.replyQ(pair);
    }
    if (box >= 2) {
      if (this.o.audio && k % 2 === 0) return this.listenQ(item, pool);
      if (words(this.text(item)).length >= 3) return this.orderQ(item);
      if (this.o.audio) return this.listenQ(item, pool);
      return this.targetQ(item, pool);
    }
    return k % 2 === 0 ? this.meaningQ(item, pool) : this.targetQ(item, pool);
  }

  /** Distractors: prefer the given pool, then the rest of the topic. Always 3 choices. */
  private pickChoices(answer: string, pool: string[]): string[] {
    const known = new Set(this.o.topic.items.map((x) => x.id).filter((id) => this.o.pack.forms[id]));
    const differs = (x: string) => x !== answer && known.has(x) && this.text(x) !== this.text(answer);
    const others = this.shuffle(pool.filter(differs));
    const rest = this.shuffle([...known].filter((x) => differs(x) && !others.includes(x)));
    return this.shuffle([answer, ...[...others, ...rest].slice(0, 2)]);
  }

  private targetChoice(id: string): Choice {
    const f = this.form(id);
    return { id, label: f.text, reading: f.reading, kind: 'target' };
  }

  private meaningQ(item: string, pool: string[]): Question {
    return {
      type: 'meaning',
      item,
      prompt: this.o.texts.promptMeaning,
      shown: this.form(item),
      choices: this.pickChoices(item, pool).map((id) => ({ id, label: this.meaning(id), kind: 'support' })),
      accepted: [item],
    };
  }

  private targetQ(item: string, pool: string[]): Question {
    return {
      type: 'target',
      item,
      prompt: fill(this.o.texts.promptTarget, { meaning: this.meaning(item) }),
      choices: this.pickChoices(item, pool).map((id) => this.targetChoice(id)),
      accepted: [item],
    };
  }

  private listenQ(item: string, pool: string[]): Question {
    if (!this.o.audio) return this.meaningQ(item, pool);
    return {
      type: 'listen',
      item,
      prompt: this.o.texts.promptListen,
      listen: this.text(item),
      choices: this.pickChoices(item, pool).map((id) => this.targetChoice(id)),
      accepted: [item],
    };
  }

  private orderQ(item: string, decoy?: string): Question {
    const answer = this.text(item);
    const ws = words(answer);
    const chips: Choice[] = ws.map((w, k) => ({ id: `w${k}`, label: w, kind: 'target' }));
    if (decoy && !ws.includes(decoy)) chips.push({ id: 'decoy', label: decoy, kind: 'target' });
    return {
      type: 'order',
      item,
      prompt: fill(this.o.texts.promptOrder, { meaning: this.meaning(item) }),
      choices: this.shuffleApart(chips),
      accepted: [],
      answer,
    };
  }

  private typeQ(item: string, context?: string): Question {
    return { type: 'type', item, prompt: fill(this.o.texts.promptType, { meaning: this.meaning(item) }), context, choices: [], accepted: [], answer: this.text(item) };
  }

  private drillQ(d: Drill): Question {
    const s = this.o.support;
    if (d.kind === 'order') return this.orderQ(d.item, d.decoy);
    if (d.kind === 'type') return this.typeQ(d.item, this.sup(d.context?.[s]));
    const name = (x: string) => x.replace(/\{name\}/g, this.o.playerName);
    return {
      type: 'fill',
      item: d.item,
      prompt: this.o.texts.promptFill,
      context: this.sup(d.context?.[s]),
      sentence: { before: name(d.before), after: name(d.after) },
      choices: this.shuffle([...d.options]).map((x) => ({ id: x, label: x, kind: 'target' })),
      accepted: [d.answer],
    };
  }

  private replyQ(p: ReplyPair): Question {
    const accepted = [p.reply].flat().filter((id) => this.o.pack.forms[id]);
    const primary = accepted[0];
    const shownRight = [primary];
    if (p.both && accepted.length > 1) shownRight.push(this.shuffle(accepted.slice(1))[0]);
    const wrong = this.shuffle(p.wrong.filter((id) => this.o.pack.forms[id])).slice(0, 2);
    const ids = this.shuffle([...shownRight, ...wrong]);
    const ctx = this.sup(p.context?.[this.o.support]);
    return {
      type: 'reply',
      item: primary,
      prompt: p.line ? fill(this.o.texts.promptReply, { name: this.o.speaker }) : this.o.texts.promptSituation,
      context: ctx,
      line: p.line ? { speaker: this.o.speaker, form: this.form(p.line, this.o.speaker) } : undefined,
      choices: ids.map((id) => this.targetChoice(id)),
      accepted,
      register: p.register,
      time: p.time,
    };
  }

  private shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Shuffle a word bank so it never shows the answer already in order. */
  private shuffleApart(chips: Choice[]): Choice[] {
    if (chips.length < 2) return chips;
    for (let k = 0; k < 8; k++) {
      const s = this.shuffle([...chips]);
      if (s.some((c, i) => c.id !== chips[i].id)) return s;
    }
    return [...chips].reverse();
  }
}

/** Without a final full stop, for quoting inside a sentence. */
const bareEnd = (x: string) => x.replace(/\.$/, '');

/**
 * Mix recognition questions so no type appears more than twice in a row while others are left
 * (LEARNING_SYSTEM §3: never more than 3 of one type in a row).
 */
function interleave(groups: Question[][]): Question[] {
  const [a, ...others] = groups.map((g) => [...g]);
  const out: Question[] = [];
  while (a.length || others.some((g) => g.length)) {
    out.push(...a.splice(0, 2));
    for (const g of others) if (g.length) out.push(g.shift()!);
  }
  return out;
}
