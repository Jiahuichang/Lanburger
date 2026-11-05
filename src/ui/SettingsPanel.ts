import type { Services } from '../core/Services';
import { LANGUAGE_NAMES, setUiLanguage, t } from '../i18n';
import { LANGUAGES, type LanguageCode } from '../learning/types';
import { icons } from './icons';

/** UI language and target language are separate settings and can never be the same (LEARNING_DESIGN §1). */
export class SettingsPanel {
  private el: HTMLElement;
  private ui: HTMLSelectElement;
  private target: HTMLSelectElement;
  private _open = false;

  constructor(parent: HTMLElement, private s: Services) {
    this.el = document.createElement('div');
    this.el.className = 'modal';
    this.el.innerHTML = `
      <div class="modal-card panel" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2 class="modal-title"></h2>
          <button class="icon-btn icon-btn--small modal-x" type="button">${icons.close}</button>
        </div>
        <label class="field">
          <span class="field-label" data-k="settings.uiLanguage"></span>
          <span class="select-wrap"><select class="sel-ui"></select></span>
        </label>
        <label class="field">
          <span class="field-label" data-k="settings.targetLanguage"></span>
          <span class="select-wrap"><select class="sel-target"></select></span>
        </label>
        <p class="field-note"></p>
        <button class="btn btn--primary modal-done" type="button"></button>
      </div>`;
    parent.append(this.el);
    this.ui = this.el.querySelector('.sel-ui')!;
    this.target = this.el.querySelector('.sel-target')!;
    for (const sel of [this.ui, this.target]) {
      for (const l of LANGUAGES) {
        const o = document.createElement('option');
        o.value = l;
        o.textContent = LANGUAGE_NAMES[l];
        sel.append(o);
      }
    }
    this.ui.addEventListener('change', () => this.apply('ui', this.ui.value as LanguageCode));
    this.target.addEventListener('change', () => this.apply('target', this.target.value as LanguageCode));
    this.el.querySelector('.modal-x')!.addEventListener('click', () => this.close());
    this.el.querySelector('.modal-done')!.addEventListener('click', () => this.close());
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this.close();
    });
    this.relabel();
  }

  get isOpen(): boolean {
    return this._open;
  }

  open(): void {
    this._open = true;
    this.sync();
    this.el.classList.add('is-open');
    this.s.input.enabled = false;
  }

  close(): void {
    this._open = false;
    this.el.classList.remove('is-open');
    this.s.input.enabled = true;
  }

  toggle(): void {
    if (this._open) this.close();
    else this.open();
  }

  relabel(): void {
    this.el.querySelector('.modal-title')!.textContent = t('settings.title');
    this.el.querySelectorAll<HTMLElement>('[data-k]').forEach((n) => (n.textContent = t(n.dataset.k as never)));
    this.el.querySelector('.field-note')!.textContent = t('settings.note');
    this.el.querySelector('.modal-done')!.textContent = t('settings.close');
    this.el.querySelector('.modal-x')!.setAttribute('aria-label', t('settings.close'));
  }

  private sync(): void {
    const p = this.s.save.data.profile;
    this.ui.value = p.uiLanguage;
    this.target.value = p.targetLanguage;
  }

  private apply(which: 'ui' | 'target', lang: LanguageCode): void {
    this.s.save.update((d) => {
      const p = d.profile;
      if (which === 'ui') {
        if (lang === p.targetLanguage) p.targetLanguage = p.uiLanguage; // swap, never equal
        p.uiLanguage = lang;
      } else {
        if (lang === p.uiLanguage) p.uiLanguage = p.targetLanguage;
        p.targetLanguage = lang;
      }
    });
    const p = this.s.save.data.profile;
    setUiLanguage(p.uiLanguage);
    this.sync();
    this.s.ui.relabel();
    this.s.events.emit('language:changed', { ui: p.uiLanguage, target: p.targetLanguage });
  }
}
