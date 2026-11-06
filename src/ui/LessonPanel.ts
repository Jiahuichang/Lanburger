import type { Services } from '../core/Services';
import type { LoadedPortrait } from '../character/types';
import type { LessonSession, Step } from '../learning/LessonSession';
import type { Form } from '../learning/content';
import type { SupportLanguage, TargetLanguage } from '../learning/types';
import { ENERGY_MAX } from '../save/schema';
import { t } from '../i18n';
import { icons } from './icons';

/** BCP-47 voices for the Listen button (Web Speech API, when the device has one). */
const VOICE: Record<TargetLanguage, string> = { en: 'en-US', es: 'es-ES', de: 'de-DE', ja: 'ja-JP', 'zh-TW': 'zh-TW' };

export interface LessonOpenOptions {
  title: string;
  target: TargetLanguage;
  support: SupportLanguage;
  teacher?: { name: string; portrait?: LoadedPortrait };
  /** Heading on the last card (default: "Lesson complete!" / "Review complete!"). */
  doneLabel?: string;
}

/**
 * The lesson card (LEARNING_SYSTEM §2): explanation, example cards, questions with immediate feedback
 * and retry, and a summary. Menu text is English (UI); explanations use the support language; target
 * text is shown large and tagged with its language. Keyboard: 1–4 pick, Enter / E / Space continue.
 */
export class LessonPanel {
  private el: HTMLElement;
  private body: HTMLElement;
  private session: LessonSession | null = null;
  private opts!: LessonOpenOptions;
  private resolve: ((completed: boolean) => void) | null = null;
  private feedback: { correct: boolean; text?: string; xp?: number } | null = null;
  private openedAt = 0;
  /** XP earned by the last answer and during this session (shown on the cards). */
  private lastXp = 0;
  private earned = 0;
  /** Correct answers in a row on the first try (shown from 3 up). */
  private streak = 0;
  /** The choice just answered, animated once on the next render. */
  private justPicked: string | null = null;

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
    this.openedAt = performance.now();
    this.s.input.enabled = false;
    document.body.classList.add('is-talking');
    this.el.querySelector('.lesson-title')!.textContent = opts.title;
    this.el.querySelector('.lesson-x')!.setAttribute('aria-label', t('lesson.leave'));
    this.el.classList.add('is-open');
    this.render();
    return new Promise((r) => (this.resolve = r));
  }

  private close(completed: boolean): void {
    if (!this.session) return;
    this.session = null;
    window.speechSynthesis?.cancel();
    this.el.classList.remove('is-open');
    document.body.classList.remove('is-talking');
    this.s.input.enabled = true;
    const r = this.resolve;
    this.resolve = null;
    r?.(completed);
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
  }

  private renderStep(st: Step): HTMLElement {
    const box = div('lesson-step');
    switch (st.kind) {
      case 'intro': {
        const row = div('lesson-teacher');
        const p = this.opts.teacher?.portrait;
        if (p) row.append(portrait(p, 'happy'));
        const talk = div('lesson-talk');
        if (this.opts.teacher) talk.append(div('lesson-name', this.opts.teacher.name));
        talk.append(support(st.text, this.opts.support, 'lesson-text'));
        if (st.note) talk.append(support(st.note, this.opts.support, 'lesson-note'));
        if (st.alert) talk.append(support(st.alert, this.opts.support, 'lesson-alert'));
        row.append(talk);
        box.append(row, this.nextButton(t('lesson.start')));
        break;
      }
      case 'example': {
        box.append(div('lesson-kicker', t('lesson.newPhrase')));
        box.append(this.targetBlock(st.form, true));
        box.append(support(st.meaning, this.opts.support, 'lesson-meaning'));
        box.append(this.nextButton(t('lesson.next')));
        break;
      }
      case 'question': {
        const q = st.q;
        if (q.line) {
          const said = div('lesson-said');
          said.append(div('lesson-name', q.line.speaker));
          said.append(this.targetBlock(q.line.form, true));
          box.append(said);
        }
        box.append(support(q.prompt, this.opts.support, 'lesson-prompt'));
        if (q.shown) box.append(this.targetBlock(q.shown, true));
        const grid = div('lesson-choices');
        const ses = this.session!;
        q.choices.forEach((c, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'lesson-choice';
          b.dataset.id = c.id;
          b.innerHTML = `<span class="dialogue-choice-key">${i + 1}</span>`;
          const label = c.kind === 'target' ? targetText(c.label, this.opts.target) : support(c.label, this.opts.support);
          label.classList.add('lesson-choice-label');
          b.append(label);
          if (c.reading) b.append(div('lesson-reading', c.reading));
          const solvedThis = this.feedback?.correct && c.id === q.item;
          if (ses.disabled.includes(c.id)) b.classList.add('is-wrong');
          if (solvedThis) b.classList.add('is-right');
          if (c.id === this.justPicked) {
            b.classList.add('is-just');
            if (solvedThis) b.append(sparkBurst(10));
          }
          b.disabled = ses.disabled.includes(c.id) || !!this.feedback?.correct;
          b.addEventListener('click', () => this.pick(c.id));
          grid.append(b);
        });
        box.append(grid);
        if (this.feedback) {
          const fb = div(`lesson-feedback ${this.feedback.correct ? 'is-right' : 'is-wrong'}`);
          const title = div('lesson-feedback-title', this.feedback.correct ? t('lesson.correct') : t('lesson.notQuite'));
          if (this.feedback.xp) title.append(div('lesson-xp', t('xp.gain', { n: this.feedback.xp })));
          if (this.feedback.correct && this.streak >= 3) title.append(div('lesson-streak', `★ ${t('lesson.streak', { n: this.streak })}`));
          fb.append(title);
          if (this.feedback.text) fb.append(support(this.feedback.text, this.opts.support, 'lesson-feedback-text'));
          box.append(fb);
        }
        if (this.feedback?.correct) box.append(this.nextButton(t('lesson.next')));
        break;
      }
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

  private targetBlock(form: Form, listen: boolean): HTMLElement {
    const wrap = div('lesson-target');
    wrap.append(targetText(form.text, this.opts.target, 'lesson-target-text'));
    if (form.reading) wrap.append(div('lesson-reading', form.reading));
    if (listen && 'speechSynthesis' in window) {
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
    if (ses.step.kind === 'complete') this.s.sfx.play('complete');
    this.render();
  }

  private pick(id: string): void {
    const ses = this.session;
    if (!ses || ses.step.kind !== 'question' || this.feedback?.correct) return;
    this.lastXp = 0;
    const firstTry = ses.disabled.length === 0;
    const r = ses.answer(id);
    this.feedback = { correct: r.correct, text: r.explanation, xp: this.lastXp };
    this.streak = r.correct && firstTry ? this.streak + 1 : 0;
    this.justPicked = id;
    this.s.sfx.play(!r.correct ? 'wrong' : this.streak >= 3 ? 'streak' : 'correct');
    this.render();
    this.justPicked = null;
  }

  private speak(text: string): void {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE[this.opts.target];
    u.rate = 0.85;
    synth.speak(u);
  }

  private onKey(e: KeyboardEvent): void {
    const ses = this.session;
    if (!ses || e.repeat || performance.now() - this.openedAt < 150) return;
    if (/^Digit[1-4]$/.test(e.code) && ses.step.kind === 'question') {
      const c = ses.step.q.choices[Number(e.code.slice(5)) - 1];
      if (c) this.pick(c.id);
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') {
      e.preventDefault();
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

/** Support-language text (explanations), tagged with its language. */
function support(text: string, lang: SupportLanguage, cls = ''): HTMLElement {
  const e = div(`lesson-support ${cls}`, text);
  e.lang = lang;
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
