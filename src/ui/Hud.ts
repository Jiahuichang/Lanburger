import type { Services } from '../core/Services';
import { LANGUAGE_NAMES, t } from '../i18n';
import { ENERGY_MAX, xpToNext } from '../save/schema';
import { icons } from './icons';

/** Player badge (level, XP, energy), learning chip, acorns, settings button, hints. */
export class Hud {
  private el: HTMLElement;
  private q = <T extends HTMLElement>(sel: string) => this.el.querySelector(sel) as T;
  private hintTimer = 0;

  constructor(parent: HTMLElement, private s: Services) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-badge panel">
        <div class="hud-avatar">${icons.leaf}</div>
        <div class="hud-info">
          <div class="hud-name-row">
            <span class="hud-name"></span>
            <span class="hud-level"></span>
          </div>
          <div class="meter meter--xp" role="meter"><div class="meter-fill"></div><span class="meter-text"></span></div>
          <div class="meter meter--energy" role="meter"><span class="meter-icon">${icons.energy}</span><div class="meter-fill"></div><span class="meter-text"></span></div>
        </div>
      </div>
      <div class="hud-right">
        <div class="chip hud-learning">${icons.book}<span></span></div>
        <div class="chip hud-acorns">${icons.acorn}<span></span></div>
        <button class="icon-btn hud-settings" type="button">${icons.gear}</button>
      </div>
      <div class="hud-footer">
        <div class="hud-hint chip"></div>
        <div class="hud-placeholder"></div>
      </div>`;
    parent.append(this.el);
    this.q<HTMLButtonElement>('.hud-settings').addEventListener('click', () => this.s.ui.settings.open());
    s.save.onChange(() => this.refresh());
    this.refresh();
  }

  refresh(): void {
    const d = this.s.save.data;
    const need = xpToNext(d.stats.level);
    this.q('.hud-name').textContent = d.profile.name || t('hud.traveler');
    this.q('.hud-level').textContent = t('hud.level', { n: d.stats.level });
    this.q<HTMLElement>('.meter--xp .meter-fill').style.width = `${Math.min(100, (d.stats.xp / need) * 100)}%`;
    this.q('.meter--xp .meter-text').textContent = `${t('hud.xp')} ${d.stats.xp}/${need}`;
    this.q<HTMLElement>('.meter--energy .meter-fill').style.width = `${(d.stats.energy / ENERGY_MAX) * 100}%`;
    this.q('.meter--energy .meter-text').textContent = `${t('hud.energy')} ${d.stats.energy}/${ENERGY_MAX}`;
    this.q('.hud-learning span').textContent = `${t('hud.learning')} · ${LANGUAGE_NAMES[d.profile.targetLanguage]}`;
    this.q('.hud-acorns span').textContent = String(d.stats.acorns);
    const settings = this.q<HTMLButtonElement>('.hud-settings');
    settings.setAttribute('aria-label', t('hud.settings'));
    settings.title = t('hud.settings');
    const touch = document.body.classList.contains('is-touch');
    this.q('.hud-hint').textContent = touch ? t('hint.touch') : t('hint.keyboard');
    this.q('.hud-placeholder').textContent = t('placeholder.notice');
  }

  /** The controls hint shows at start and fades out once the player moves. */
  showHint(on: boolean): void {
    const hint = this.q('.hud-hint');
    if (on) {
      hint.classList.add('is-shown');
      window.clearTimeout(this.hintTimer);
      this.hintTimer = window.setTimeout(() => hint.classList.remove('is-shown'), 12000);
    } else if (hint.classList.contains('is-shown')) {
      window.clearTimeout(this.hintTimer);
      this.hintTimer = window.setTimeout(() => hint.classList.remove('is-shown'), 2500);
    }
  }
}
