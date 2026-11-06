import type { Services } from '../core/Services';
import { LANGUAGE_NAMES, t } from '../i18n';
import { SUPPORT_LANGUAGES, TARGET_LANGUAGES, type SupportLanguage, type TargetLanguage } from '../learning/types';
import { icons } from './icons';

/**
 * Menus are always English (GAME_DESIGN §10). The player picks the language to learn and the
 * language lesson explanations are written in (LEARNING_SYSTEM §7, decision #3).
 */
export class SettingsPanel {
  private el: HTMLElement;
  private target: HTMLSelectElement;
  private support: HTMLSelectElement;
  private sfx: HTMLSelectElement;
  private music: HTMLSelectElement;
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
          <span class="field-label" data-k="settings.targetLanguage"></span>
          <span class="select-wrap"><select class="sel-target"></select></span>
        </label>
        <label class="field">
          <span class="field-label" data-k="settings.supportLanguage"></span>
          <span class="select-wrap"><select class="sel-support"></select></span>
        </label>
        <label class="field">
          <span class="field-label" data-k="settings.music"></span>
          <span class="select-wrap"><select class="sel-music"><option value="on"></option><option value="off"></option></select></span>
        </label>
        <label class="field">
          <span class="field-label" data-k="settings.sfx"></span>
          <span class="select-wrap"><select class="sel-sfx"><option value="on"></option><option value="off"></option></select></span>
        </label>
        <p class="field-note"></p>
        <button class="btn btn--primary modal-done" type="button"></button>
      </div>`;
    parent.append(this.el);
    this.target = this.el.querySelector('.sel-target')!;
    this.support = this.el.querySelector('.sel-support')!;
    this.sfx = this.el.querySelector('.sel-sfx')!;
    this.music = this.el.querySelector('.sel-music')!;
    this.music.addEventListener('change', () => {
      this.s.save.update((d) => void (d.settings.musicVolume = this.music.value === 'on' ? 0.7 : 0));
      this.s.save.flush();
      this.s.music.refreshVolume();
    });
    this.sfx.addEventListener('change', () => {
      const on = this.sfx.value === 'on';
      this.s.save.update((d) => void (d.settings.sfxVolume = on ? 0.8 : 0));
      this.s.save.flush();
      if (on) this.s.sfx.play('correct');
    });
    fill(this.target, TARGET_LANGUAGES);
    fill(this.support, SUPPORT_LANGUAGES);
    this.target.addEventListener('change', () => this.apply());
    this.support.addEventListener('change', () => this.apply());
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
    for (const sel of [this.sfx, this.music]) {
      sel.options[0].textContent = t('settings.on');
      sel.options[1].textContent = t('settings.off');
    }
    this.el.querySelector('.modal-done')!.textContent = t('settings.close');
    this.el.querySelector('.modal-x')!.setAttribute('aria-label', t('settings.close'));
  }

  private sync(): void {
    const p = this.s.save.data.profile;
    this.target.value = p.targetLanguage;
    this.support.value = p.supportLanguage;
    this.sfx.value = this.s.save.data.settings.sfxVolume > 0 ? 'on' : 'off';
    this.music.value = this.s.save.data.settings.musicVolume > 0 ? 'on' : 'off';
  }

  private apply(): void {
    const target = this.target.value as TargetLanguage;
    const support = this.support.value as SupportLanguage;
    this.s.save.update((d) => {
      d.profile.targetLanguage = target;
      d.profile.supportLanguage = support;
      delete d.flags.needsLanguagePick;
    });
    this.s.events.emit('language:changed', { target, support });
  }
}

function fill(sel: HTMLSelectElement, langs: readonly TargetLanguage[]): void {
  for (const l of langs) {
    const o = document.createElement('option');
    o.value = l;
    o.textContent = LANGUAGE_NAMES[l];
    sel.append(o);
  }
}
