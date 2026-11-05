import type { Services } from '../core/Services';
import type { Expression, LoadedPortrait } from '../character/types';
import type { DialogueRunner } from '../dialogue/DialogueRunner';
import { t } from '../i18n';

/** Who a speaker id is on screen. */
export interface SpeakerInfo {
  name: string;
  portrait?: LoadedPortrait;
}

const CHARS_PER_SECOND = 48;

/**
 * Dialogue panel (ART_DIRECTION §7): portrait with expression, gold name plate, typewriter text,
 * and choices. Works with keyboard (E / Enter / Space, arrows or W/S, number keys) and touch (tap).
 * Movement is paused while it is open.
 */
export class DialogueBox {
  private el: HTMLElement;
  private portrait: HTMLCanvasElement;
  private nameEl: HTMLElement;
  private textEl: HTMLElement;
  private choicesEl: HTMLElement;
  private moreEl: HTMLElement;
  private runner: DialogueRunner | null = null;
  private resolveSpeaker: (id: string) => SpeakerInfo = (id) => ({ name: id });
  private onClose: (() => void) | null = null;
  private full = '';
  private shown = 0;
  private typeTimer = 0;
  private selected = 0;
  private openedAt = 0;

  constructor(parent: HTMLElement, private s: Services) {
    this.el = document.createElement('div');
    this.el.className = 'dialogue';
    this.el.setAttribute('role', 'dialog');
    this.el.innerHTML = `
      <div class="dialogue-card panel">
        <div class="dialogue-portrait"><canvas width="64" height="64"></canvas></div>
        <div class="dialogue-main">
          <div class="dialogue-name"></div>
          <div class="dialogue-text" aria-live="polite"></div>
          <div class="dialogue-choices"></div>
        </div>
        <div class="dialogue-more" aria-hidden="true">▼</div>
      </div>`;
    parent.append(this.el);
    this.portrait = this.el.querySelector('canvas')!;
    this.nameEl = this.el.querySelector('.dialogue-name')!;
    this.textEl = this.el.querySelector('.dialogue-text')!;
    this.choicesEl = this.el.querySelector('.dialogue-choices')!;
    this.moreEl = this.el.querySelector('.dialogue-more')!;

    this.el.querySelector('.dialogue-card')!.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.dialogue-choice')) return;
      e.preventDefault();
      this.next();
    });
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  get isOpen(): boolean {
    return this.runner !== null;
  }

  /** Show a conversation; resolves when it ends. */
  open(runner: DialogueRunner, resolveSpeaker: (id: string) => SpeakerInfo): Promise<void> {
    this.runner = runner;
    this.resolveSpeaker = resolveSpeaker;
    this.openedAt = performance.now();
    this.s.input.enabled = false;
    this.el.classList.add('is-open');
    document.body.classList.add('is-talking');
    this.render();
    return new Promise((resolve) => (this.onClose = resolve));
  }

  private close(): void {
    this.runner = null;
    window.clearInterval(this.typeTimer);
    this.el.classList.remove('is-open');
    document.body.classList.remove('is-talking');
    this.s.input.enabled = true;
    const done = this.onClose;
    this.onClose = null;
    done?.();
  }

  private render(): void {
    const line = this.runner?.line;
    if (!line) {
      this.close();
      return;
    }
    const who = this.resolveSpeaker(line.speaker);
    this.nameEl.textContent = who.name;
    this.drawPortrait(who.portrait, line.expression ?? 'neutral');
    this.el.classList.toggle('no-portrait', !who.portrait);

    this.full = line.text;
    this.shown = 0;
    this.choicesEl.innerHTML = '';
    this.selected = 0;
    this.moreEl.classList.remove('is-shown');
    window.clearInterval(this.typeTimer);
    if (this.s.save.data.settings.reducedMotion) this.finishTyping();
    else {
      this.typeTimer = window.setInterval(() => {
        this.shown = Math.min(this.full.length, this.shown + 2);
        this.textEl.textContent = this.full.slice(0, this.shown);
        if (this.shown >= this.full.length) this.finishTyping();
      }, 2000 / CHARS_PER_SECOND);
      this.textEl.textContent = '';
    }
  }

  private finishTyping(): void {
    window.clearInterval(this.typeTimer);
    this.shown = this.full.length;
    this.textEl.textContent = this.full;
    const choices = this.runner?.choices;
    if (choices?.length) {
      choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dialogue-choice';
        b.innerHTML = `<span class="dialogue-choice-key">${i + 1}</span><span></span>`;
        b.lastElementChild!.textContent = c.text;
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.pick(i);
        });
        this.choicesEl.append(b);
      });
      this.highlight();
    } else {
      this.moreEl.classList.add('is-shown');
      this.moreEl.setAttribute('aria-label', t('dialogue.next'));
    }
  }

  private get typing(): boolean {
    return this.shown < this.full.length;
  }

  /** Advance: finish the typewriter first, then go to the next line. */
  private next(): void {
    if (!this.runner) return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.runner.choices.length) {
      this.pick(this.selected);
      return;
    }
    this.runner.advance();
    this.render();
  }

  private pick(i: number): void {
    if (!this.runner || this.typing) return;
    this.runner.choose(i);
    this.render();
  }

  private highlight(): void {
    this.choicesEl.querySelectorAll('.dialogue-choice').forEach((b, i) => b.classList.toggle('is-selected', i === this.selected));
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.runner || e.repeat) return;
    // ignore the very key press that opened the dialogue
    if (performance.now() - this.openedAt < 120) return;
    const n = this.runner.choices.length;
    switch (e.code) {
      case 'KeyE':
      case 'Enter':
      case 'Space':
        e.preventDefault();
        this.next();
        break;
      case 'ArrowUp':
      case 'KeyW':
        if (n) {
          this.selected = (this.selected + n - 1) % n;
          this.highlight();
        }
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (n) {
          this.selected = (this.selected + 1) % n;
          this.highlight();
        }
        break;
      default:
        if (/^Digit[1-9]$/.test(e.code)) {
          const i = Number(e.code.slice(5)) - 1;
          if (i < n) this.pick(i);
        }
    }
  }

  private drawPortrait(p: LoadedPortrait | undefined, e: Expression): void {
    const ctx = this.portrait.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    if (!p) return;
    const S = p.manifest.size;
    ctx.drawImage(p.sheet, p.manifest.expressions[e] * S, 0, S, S, 0, 0, 64, 64);
  }
}
