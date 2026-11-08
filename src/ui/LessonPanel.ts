import type { Services } from '../core/Services';
import type { LoadedPortrait } from '../character/types';
import type { AnswerResult, Choice, LessonSession, Question, Step } from '../learning/LessonSession';
import type { Form } from '../learning/content';
import type { SupportLanguage, TargetLanguage } from '../learning/types';
import { ENERGY_MAX } from '../save/schema';
import { speak, speechAvailable, stopSpeaking } from '../audio/Voice';
import { t } from '../i18n';
import { icons } from './icons';
import { releaseFocus } from './focus';

/** Letters many keyboards cannot type, offered as buttons under typed answers. */
const SPECIAL_KEYS: Partial<Record<TargetLanguage, string[]>> = {
  es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  de: ['ä', 'ö', 'ü', 'ß'],
};

export interface LessonOpenOptions {
  title: string;
  target: TargetLanguage;
  support: SupportLanguage;
  teacher?: { name: string; portrait?: LoadedPortrait };
  /** Heading on the last card (default: "Lesson complete!" / "Review complete!"). */
  doneLabel?: string;
}

interface Feedback {
  correct: boolean;
  almost?: boolean;
  text?: string;
  tip?: string;
  xp?: number;
  /** The choice that solved the question. */
  picked?: string;
}

/**
 * The lesson card (LEARNING_SYSTEM §2): explanation, example cards, questions with immediate feedback
 * and retry, and a summary. Menu text is English (UI); explanations use the support language; target
 * text is shown large and tagged with its language.
 * Keyboard: 1–9 pick (or add a word), Backspace removes the last word, Enter / E / Space continue or check.
 */
export class LessonPanel {
  private el: HTMLElement;
  private body: HTMLElement;
  private session: LessonSession | null = null;
  private opts!: LessonOpenOptions;
  private resolve: ((completed: boolean) => void) | null = null;
  private feedback: Feedback | null = null;
  private openedAt = 0;
  /** XP earned by the last answer and during this session (shown on the cards). */
  private lastXp = 0;
  private earned = 0;
  /** Correct answers in a row on the first try (shown from 3 up). */
  private streak = 0;
  /** The choice just answered, animated once on the next render. */
  private justPicked: string | null = null;
  /** Word-order question: word ids placed so far. */
  private built: string[] = [];
  /** Typed answer in progress. */
  private typed = '';
  /** Listening question: words shown because the player can't listen right now. */
  private showWords = false;
  /** Step index the listening audio was last played for (autoplay once per question). */
  private playedFor = -1;

  constructor(parent: HTMLElement, private s: Services) {
    this.el = document.createElement('div');
    this.el.className = 'modal lesson';
    this.el.innerHTML = `
      <div class="lesson-card panel" role="dialog" aria-modal="true">
        <div class="lesson-head">
          <h2 class="lesson-title"></h2>
          <div class="lesson-dots" aria-hidden="true"></div>
          <div class="chip lesson-energy">${icons.energy}<span></span></div>
          <button class="icon-btn icon-btn--small lesson-x" type="button">${icons.close}</button>
        </div>
        <div class="lesson-body"></div>
      </div>`;
    parent.append(this.el);
    this.body = this.el.querySelector('.lesson-body')!;
    this.el.querySelector('.lesson-x')!.addEventListener('click', () => this.close(false));
    window.addEventListener('keydown', (e) => this.onKey(e));
    s.save.onChange(() => this.renderEnergy());
    s.events.on('progress:xp', ({ amount }) => {
      if (!this.session) return;
      this.lastXp += amount;
      this.earned += amount;
    });
  }

  get isOpen(): boolean {
    return this.session !== null;
  }

  /** Run a session; resolves true if the player reached the end, false if they left early (no penalty). */
  open(session: LessonSession, opts: LessonOpenOptions): Promise<boolean> {
    this.session = session;
    this.opts = opts;
    this.feedback = null;
    this.earned = 0;
    this.streak = 0;
    this.justPicked = null;
    this.resetQuestion();
    this.playedFor = -1;
    this.openedAt = performance.now();
    this.s.input.enabled = false;
    document.body.classList.add('is-talking');
    this.el.querySelector('.lesson-title')!.textContent = opts.title;
    this.el.querySelector('.lesson-x')!.setAttribute('aria-label', t('lesson.leave'));
    this.el.classList.add('is-open');
    this.s.music.duck(true);
    this.render();
    return new Promise((r) => (this.resolve = r));
  }

  private close(completed: boolean): void {
    if (!this.session) return;
    this.session = null;
    stopSpeaking();
    releaseFocus(this.el);
    this.el.classList.remove('is-open');
    this.s.music.duck(false);
    document.body.classList.remove('is-talking');
    this.s.input.enabled = true;
    const r = this.resolve;
    this.resolve = null;
    r?.(completed);
  }

  private resetQuestion(): void {
    this.built = [];
    this.typed = '';
    this.showWords = false;
  }

  private renderEnergy(): void {
    this.el.querySelector('.lesson-energy span')!.textContent = `${this.s.save.data.stats.energy}/${ENERGY_MAX}`;
  }

  private render(): void {
    const ses = this.session;
    if (!ses) return;
    this.renderEnergy();
    const dots = this.el.querySelector('.lesson-dots')!;
    dots.innerHTML = ses.steps.map((_, i) => `<i class="${i < ses.index ? 'done' : i === ses.index ? 'now' : ''}"></i>`).join('');
    const st = ses.step;
    this.body.innerHTML = '';
    this.body.append(this.renderStep(st));
    const input = this.body.querySelector<HTMLInputElement>('.lesson-input');
    if (input && !input.disabled) {
      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
    }
    if (st.kind === 'question' && st.q.type === 'listen' && this.playedFor !== ses.index) {
      this.playedFor = ses.index;
      window.setTimeout(() => this.speak(st.q.listen ?? ''), 250);
    }
  }

  private renderStep(st: Step): HTMLElement {
    const box = div('lesson-step');
    switch (st.kind) {
      case 'intro': {
        if (st.unit) box.append(div('lesson-kicker', st.unit));
        const row = div('lesson-teacher');
        const p = this.opts.teacher?.portrait;
        if (p) row.append(portrait(p, 'happy'));
        const talk = div('lesson-talk');
        if (this.opts.teacher) talk.append(div('lesson-name', this.opts.teacher.name));
        talk.append(support(st.text, this.opts.support, 'lesson-text'));
        if (st.goal) talk.append(labelled(t('lesson.goal'), st.goal, this.opts.support, 'lesson-goal'));
        if (st.rule) talk.append(labelled(t('lesson.rule'), st.rule, this.opts.support, 'lesson-rule'));
        if (st.note) talk.append(support(st.note, this.opts.support, 'lesson-note'));
        if (st.alert) talk.append(support(st.alert, this.opts.support, 'lesson-alert'));
        row.append(talk);
        box.append(row, this.nextButton(t('lesson.start')));
        break;
      }
      case 'example': {
        box.append(div('lesson-kicker', t('lesson.newPhrase')));
        if (st.level && st.level !== 'A1') box.append(div('level-tag', t('lesson.beyondLevel', { level: 'A1' })));
        box.append(this.targetBlock(st.form, true));
        box.append(support(st.meaning, this.opts.support, 'lesson-meaning'));
        if (st.note) box.append(support(st.note, this.opts.support, 'lesson-note lesson-note--example'));
        box.append(this.nextButton(t('lesson.next')));
        break;
      }
      case 'gender': {
        const row = div('lesson-teacher');
        const p = this.opts.teacher?.portrait;
        if (p) row.append(portrait(p, 'happy'));
        const talk = div('lesson-talk');
        if (this.opts.teacher) talk.append(div('lesson-name', this.opts.teacher.name));
        talk.append(support(st.text, this.opts.support, 'lesson-text'));
        row.append(talk);
        box.append(row, div('lesson-kicker', t('lesson.formsTitle')));
        const grid = div('lesson-choices lesson-choices--two');
        st.options.forEach((o, i) => {
          const b = choiceButton(i, targetText(t(o.id === 'm' ? 'lesson.formsM' : 'lesson.formsF', { word: o.word }), this.opts.target));
          b.classList.toggle('is-right', st.picked === o.id);
          b.addEventListener('click', () => this.pickGender(o.id));
          grid.append(b);
        });
        box.append(grid);
        if (st.confirm) {
          box.append(feedbackBox({ correct: true, text: st.confirm }, this.opts.support, t('lesson.correct')));
          box.append(this.nextButton(t('lesson.next')));
        }
        break;
      }
      case 'question':
        this.renderQuestion(box, st.q);
        break;
      case 'complete': {
        const kicker = div('lesson-kicker lesson-kicker--done', this.opts.doneLabel ?? (st.text ? t('lesson.complete') : t('lesson.reviewDone')));
        kicker.append(sparkBurst(14, 'big'));
        box.append(kicker);
        if (this.earned > 0) box.append(div('lesson-xp-total', t('xp.gain', { n: this.earned })));
        if (st.text) box.append(support(st.text, this.opts.support, 'lesson-text'));
        const list = div('lesson-summary');
        for (const [i, it] of st.items.entries()) {
          const row = div('lesson-summary-row');
          row.style.setProperty('--i', String(i));
          row.append(targetText(it.form.text, this.opts.target), support(it.meaning, this.opts.support, 'lesson-summary-meaning'));
          list.append(row);
        }
        box.append(list, this.nextButton(t('lesson.finish'), () => this.close(true)));
        break;
      }
    }
    return box;
  }

  private renderQuestion(box: HTMLElement, q: Question): void {
    const ses = this.session!;
    const solved = !!this.feedback?.correct;
    if (q.context) {
      const c = div('lesson-context');
      c.append(div('lesson-context-label', t('lesson.situation')), support(q.context, this.opts.support));
      box.append(c);
    }
    if (q.line) {
      const said = div('lesson-said');
      said.append(div('lesson-name', q.line.speaker));
      said.append(this.targetBlock(q.line.form, true));
      box.append(said);
    }
    box.append(support(q.prompt, this.opts.support, 'lesson-prompt'));
    if (q.shown) box.append(this.targetBlock(q.shown, true));
    if (q.type === 'listen') box.append(this.listenBlock(q, solved));
    if (q.type === 'fill' && q.sentence) {
      const sent = div('lesson-target lesson-sentence');
      const line = targetText('', this.opts.target, 'lesson-target-text');
      const gap = document.createElement('span');
      gap.className = `lesson-gap${solved ? ' is-filled' : ''}`;
      gap.textContent = solved ? (this.feedback?.picked ?? q.accepted[0]) : '＿＿';
      line.append(q.sentence.before, gap, q.sentence.after);
      sent.append(line);
      box.append(sent);
    }

    if (q.type === 'order') box.append(this.orderBlock(q, solved));
    else if (q.type === 'type') box.append(this.typeBlock(solved));
    else {
      const grid = div('lesson-choices');
      q.choices.forEach((c, i) => {
        const label = c.kind === 'target' ? targetText(c.label, this.opts.target) : support(c.label, this.opts.support);
        const b = choiceButton(i, label, c.reading);
        b.dataset.id = c.id;
        const solvedThis = solved && c.id === this.feedback?.picked;
        if (ses.disabled.includes(c.id)) b.classList.add('is-wrong');
        if (solvedThis) b.classList.add('is-right');
        if (c.id === this.justPicked) {
          b.classList.add('is-just');
          if (solvedThis) b.append(sparkBurst(10));
        }
        b.disabled = ses.disabled.includes(c.id) || solved;
        b.addEventListener('click', () => this.pick(c.id));
        grid.append(b);
      });
      box.append(grid);
    }
    if ((q.type === 'order' || q.type === 'type') && solved && q.answer !== undefined) {
      box.append(this.targetBlock({ text: q.answer }, true));
    }
    if (this.feedback) {
      const title = this.feedback.correct ? t('lesson.correct') : this.feedback.almost ? t('lesson.almost') : t('lesson.notQuite');
      const fb = feedbackBox(this.feedback, this.opts.support, title);
      if (this.feedback.correct && this.streak >= 3) fb.querySelector('.lesson-feedback-title')!.append(div('lesson-streak', `★ ${t('lesson.streak', { n: this.streak })}`));
      box.append(fb);
    }
    if (solved) box.append(this.nextButton(t('lesson.next')));
  }

  private listenBlock(q: Question, solved: boolean): HTMLElement {
    const wrap = div('lesson-listen-block');
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'btn btn--primary lesson-play';
    play.innerHTML = `${icons.speaker}<span>${t('lesson.play')}</span>`;
    play.addEventListener('click', () => this.speak(q.listen ?? ''));
    const slow = document.createElement('button');
    slow.type = 'button';
    slow.className = 'chip lesson-listen';
    slow.textContent = t('lesson.playSlow');
    slow.addEventListener('click', () => this.speak(q.listen ?? '', 0.6));
    wrap.append(play, slow);
    if (!solved) {
      if (this.showWords) wrap.append(targetText(q.listen ?? '', this.opts.target, 'lesson-listen-words'));
      else {
        const show = document.createElement('button');
        show.type = 'button';
        show.className = 'link-btn lesson-show-words';
        show.textContent = t('lesson.showText');
        show.addEventListener('click', () => {
          this.showWords = true;
          this.render();
        });
        wrap.append(show);
      }
    }
    return wrap;
  }

  private orderBlock(q: Question, solved: boolean): HTMLElement {
    const wrap = div('lesson-order');
    const line = div('lesson-order-line');
    line.setAttribute('aria-live', 'polite');
    for (const id of this.built) {
      const c = q.choices.find((x) => x.id === id)!;
      const b = wordChip(c.label, this.opts.target);
      b.disabled = solved;
      b.addEventListener('click', () => {
        this.built = this.built.filter((x) => x !== id);
        this.render();
      });
      line.append(b);
    }
    if (!this.built.length) line.append(div('lesson-order-empty', '…'));
    const bank = div('lesson-order-bank');
    q.choices.forEach((c, i) => {
      const used = this.built.includes(c.id);
      const b = wordChip(c.label, this.opts.target, i + 1);
      b.classList.toggle('is-used', used);
      b.disabled = used || solved;
      b.addEventListener('click', () => this.addWord(c));
      bank.append(b);
    });
    wrap.append(line, bank);
    if (!solved) {
      const row = div('lesson-actions');
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'btn';
      clear.textContent = t('lesson.clear');
      clear.addEventListener('click', () => {
        this.built = [];
        this.render();
      });
      const check = document.createElement('button');
      check.type = 'button';
      check.className = 'btn btn--primary';
      check.textContent = t('lesson.check');
      check.disabled = this.built.length === 0;
      check.addEventListener('click', () => this.checkOrder());
      row.append(clear, check);
      wrap.append(row);
    }
    return wrap;
  }

  private typeBlock(solved: boolean): HTMLElement {
    const wrap = div('lesson-type');
    const form = document.createElement('form');
    form.className = 'lesson-type-form';
    const input = document.createElement('input');
    input.className = 'lesson-input target';
    input.lang = this.opts.target;
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocapitalize', 'sentences');
    input.setAttribute('autocorrect', 'off');
    input.placeholder = t('lesson.typeHere');
    input.setAttribute('aria-label', t('lesson.typeHere'));
    input.value = this.typed;
    input.disabled = solved;
    input.addEventListener('input', () => (this.typed = input.value));
    const check = document.createElement('button');
    check.type = 'submit';
    check.className = 'btn btn--primary';
    check.textContent = t('lesson.check');
    check.disabled = solved;
    form.append(input, check);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.checkTyped();
    });
    wrap.append(form);
    const keys = SPECIAL_KEYS[this.opts.target];
    if (keys && !solved) {
      const row = div('lesson-keys');
      row.setAttribute('aria-label', t('lesson.accentKeys'));
      for (const k of keys) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lesson-key target';
        b.lang = this.opts.target;
        b.textContent = k;
        // keep the caret in the input on touch screens
        b.addEventListener('pointerdown', (e) => e.preventDefault());
        b.addEventListener('click', () => {
          const at = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? at;
          input.value = input.value.slice(0, at) + k + input.value.slice(end);
          this.typed = input.value;
          input.focus();
          input.setSelectionRange(at + k.length, at + k.length);
        });
        row.append(b);
      }
      wrap.append(row);
    }
    return wrap;
  }

  private targetBlock(form: Form, listen: boolean): HTMLElement {
    const wrap = div('lesson-target');
    wrap.append(targetText(form.text, this.opts.target, 'lesson-target-text'));
    if (form.reading) wrap.append(div('lesson-reading', form.reading));
    if (listen && speechAvailable() && this.s.save.data.settings.listening) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip lesson-listen';
      b.innerHTML = `${icons.speaker}<span>${t('lesson.listen')}</span>`;
      b.addEventListener('click', () => this.speak(form.text));
      wrap.append(b);
    }
    return wrap;
  }

  private nextButton(label: string, onClick?: () => void): HTMLElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--primary lesson-next';
    b.textContent = label;
    b.addEventListener('click', () => (onClick ? onClick() : this.advance()));
    return b;
  }

  private advance(): void {
    const ses = this.session;
    if (!ses) return;
    if (ses.done) {
      this.close(true);
      return;
    }
    if (!ses.canAdvance) return;
    ses.next();
    this.feedback = null;
    this.resetQuestion();
    if (ses.step.kind === 'complete') this.s.sfx.play('complete');
    this.render();
  }

  private pickGender(g: 'm' | 'f'): void {
    const ses = this.session;
    if (!ses || ses.step.kind !== 'gender') return;
    ses.pickGender(g);
    this.s.sfx.play('correct');
    this.render();
  }

  private pick(id: string): void {
    const ses = this.session;
    if (!ses || ses.step.kind !== 'question' || this.feedback?.correct) return;
    const firstTry = ses.disabled.length === 0;
    this.lastXp = 0;
    this.show(ses.answer(id), firstTry, id);
  }

  private addWord(c: Choice): void {
    if (this.feedback?.correct || this.built.includes(c.id)) return;
    this.built = [...this.built, c.id];
    this.render();
  }

  private checkOrder(): void {
    const ses = this.session;
    if (!ses || !this.built.length || this.feedback?.correct) return;
    const firstTry = !this.feedback;
    this.lastXp = 0;
    const r = ses.answerOrder(this.built);
    if (!r.correct) this.built = [];
    this.show(r, firstTry);
  }

  private checkTyped(): void {
    const ses = this.session;
    if (!ses || !this.typed.trim() || this.feedback?.correct) return;
    const firstTry = !this.feedback || !!this.feedback.almost;
    this.lastXp = 0;
    this.show(ses.answerText(this.typed), firstTry);
  }

  /** Show the result of an answer: feedback card, sounds, streak. */
  private show(r: AnswerResult, firstTry: boolean, picked?: string): void {
    this.feedback = { correct: r.correct, almost: r.almost, text: r.explanation, tip: r.tip, xp: this.lastXp, picked };
    if (!r.almost) this.streak = r.correct && firstTry && !this.session?.revealed ? this.streak + 1 : 0;
    this.justPicked = picked ?? null;
    if (!r.almost) this.s.sfx.play(!r.correct ? 'wrong' : this.streak >= 3 ? 'streak' : 'correct');
    this.render();
    this.justPicked = null;
  }

  private speak(text: string, rate = 0.85): void {
    if (!this.s.save.data.settings.listening) return;
    speak(text, this.opts.target, rate);
  }

  private onKey(e: KeyboardEvent): void {
    const ses = this.session;
    if (!ses || e.repeat || performance.now() - this.openedAt < 150) return;
    const inField = e.target instanceof HTMLInputElement;
    if (inField) {
      // the form handles Enter while typing; once solved, Enter moves on
      if (e.code === 'Enter' && this.feedback?.correct) {
        e.preventDefault();
        this.advance();
      }
      return;
    }
    const st = ses.step;
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (digit) {
      const k = Number(digit[1]) - 1;
      if (st.kind === 'gender') {
        const o = st.options[k];
        if (o) this.pickGender(o.id);
      } else if (st.kind === 'question' && st.q.type === 'order') {
        const c = st.q.choices[k];
        if (c && !this.built.includes(c.id)) this.addWord(c);
      } else if (st.kind === 'question' && st.q.type !== 'type') {
        const c = st.q.choices[k];
        if (c) this.pick(c.id);
      }
      return;
    }
    if (e.code === 'Backspace' && st.kind === 'question' && st.q.type === 'order' && this.built.length && !this.feedback?.correct) {
      e.preventDefault();
      this.built = this.built.slice(0, -1);
      this.render();
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') {
      e.preventDefault();
      if (st.kind === 'question' && st.q.type === 'order' && !this.feedback?.correct) {
        if (e.code === 'Enter') this.checkOrder();
        return;
      }
      this.advance();
    }
  }
}

/** Little pixel sparks flying out from the middle of an element (CSS animates them, then they fade). */
function sparkBurst(n: number, size: 'small' | 'big' = 'small'): HTMLElement {
  const b = div(`spark-burst spark-burst--${size}`);
  b.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.style.setProperty('--a', `${Math.round((360 / n) * i + (i % 2) * 9)}deg`);
    b.append(s);
  }
  return b;
}

function div(cls: string, text?: string): HTMLElement {
  const e = document.createElement('div');
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function choiceButton(i: number, label: HTMLElement, reading?: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'lesson-choice';
  b.innerHTML = `<span class="dialogue-choice-key">${i + 1}</span>`;
  label.classList.add('lesson-choice-label');
  b.append(label);
  if (reading) b.append(div('lesson-reading', reading));
  return b;
}

function wordChip(text: string, lang: TargetLanguage, key?: number): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'lesson-word';
  if (key !== undefined && key <= 9) b.innerHTML = `<span class="lesson-word-key">${key}</span>`;
  b.append(targetText(text, lang));
  return b;
}

function feedbackBox(f: Feedback, lang: SupportLanguage, title: string): HTMLElement {
  const fb = div(`lesson-feedback ${f.correct ? 'is-right' : 'is-wrong'}${f.almost ? ' is-almost' : ''}`);
  const head = div('lesson-feedback-title', title);
  if (f.xp) head.append(div('lesson-xp', t('xp.gain', { n: f.xp })));
  fb.append(head);
  if (f.text) fb.append(support(f.text, lang, 'lesson-feedback-text'));
  if (f.tip) fb.append(support(f.tip, lang, 'lesson-feedback-text lesson-tip'));
  return fb;
}

/** Support-language text (explanations), tagged with its language. */
function support(text: string, lang: SupportLanguage, cls = ''): HTMLElement {
  const e = div(`lesson-support ${cls}`, text);
  e.lang = lang;
  return e;
}

/** A short labelled block (goal, rule). The label is English UI; the text is the support language. */
function labelled(label: string, text: string, lang: SupportLanguage, cls: string): HTMLElement {
  const e = div(`lesson-labelled ${cls}`);
  e.append(div('lesson-labelled-label', label), support(text, lang));
  return e;
}

/** Target-language text, tagged with its language so CJK picks the right font. */
function targetText(text: string, lang: TargetLanguage, cls = ''): HTMLElement {
  const e = document.createElement('span');
  e.className = `target ${cls}`;
  e.lang = lang;
  e.textContent = text;
  return e;
}

function portrait(p: LoadedPortrait, expression: 'happy'): HTMLElement {
  const wrap = div('lesson-portrait');
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const S = p.manifest.size;
  ctx.drawImage(p.sheet, p.manifest.expressions[expression] * S, 0, S, S, 0, 0, 64, 64);
  wrap.append(c);
  return wrap;
}
