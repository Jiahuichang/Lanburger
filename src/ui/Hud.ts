import type { Services } from '../core/Services';
import { LANGUAGE_NAMES, t, type StringKey } from '../i18n';
import { ENERGY_MAX, xpToNext } from '../save/schema';
import { icons } from './icons';

const MENU: { key: StringKey; icon: keyof typeof icons; cls: string }[] = [
  { key: 'hud.quests', icon: 'quests', cls: 'quests' },
  { key: 'hud.bag', icon: 'bag', cls: 'bag' },
  { key: 'hud.learn', icon: 'learn', cls: 'learn' },
  { key: 'hud.collection', icon: 'collection', cls: 'collection' },
  { key: 'hud.settings', icon: 'gear', cls: 'settings' },
];

/**
 * HUD (ART_DIRECTION §7): portrait + Lv + name + Energy/XP bars top-left; menu buttons top-right;
 * location chip; a controls hint. Quests/Bag/Learn/Collection open in later phases.
 */
export class Hud {
  private el: HTMLElement;
  private q = <T extends HTMLElement>(sel: string) => this.el.querySelector(sel) as T;
  private hintTimer = 0;

  constructor(parent: HTMLElement, private s: Services) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-badge">
        <div class="hud-portrait"><canvas width="32" height="30"></canvas></div>
        <div class="hud-info">
          <div class="hud-name-row"><span class="hud-level"></span><span class="hud-name"></span></div>
          <div class="meter meter--energy" role="meter"><span class="meter-label"></span><div class="meter-track"><div class="meter-fill"></div><span class="meter-text"></span></div></div>
          <div class="meter meter--xp" role="meter"><span class="meter-label"></span><div class="meter-track"><div class="meter-fill"></div><span class="meter-text"></span></div></div>
        </div>
      </div>
      <div class="hud-menu">
        ${MENU.map((m) => `<button class="menu-btn menu-btn--${m.cls}" type="button" data-k="${m.key}"><span class="menu-icon">${icons[m.icon]}</span><span class="menu-label"></span></button>`).join('')}
      </div>
      <div class="hud-chips">
        <div class="chip hud-location">${icons.pin}<span></span></div>
        <div class="chip hud-learning"><span></span></div>
      </div>
      <div class="hud-footer"><div class="hud-hint chip"></div></div>`;
    parent.append(this.el);

    this.el.querySelectorAll<HTMLButtonElement>('.menu-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const key = b.dataset.k as StringKey;
        if (key === 'hud.settings') this.s.ui.settings.open();
        else this.s.ui.toast(t('hud.comingSoon', { name: t(key) }));
      });
    });
    s.save.onChange(() => this.refresh());
    this.refresh();
  }

  /** Draw the hero's face from its sprite sheet (first idle frame), never from a hard-coded image. */
  setPortrait(sheet: CanvasImageSource, frameWidth: number): void {
    const canvas = this.q<HTMLCanvasElement>('.hud-portrait canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sheet, 0, 10, frameWidth, 30, 0, 0, frameWidth, 30);
  }

  setLocation(name: string): void {
    this.q('.hud-location span').textContent = name;
  }

  refresh(): void {
    const d = this.s.save.data;
    const need = xpToNext(d.stats.level);
    this.q('.hud-name').textContent = d.profile.name || 'Lanburger';
    this.q('.hud-level').textContent = t('hud.level', { n: d.stats.level });
    this.q('.meter--energy .meter-label').textContent = t('hud.energy');
    this.q<HTMLElement>('.meter--energy .meter-fill').style.width = `${(d.stats.energy / ENERGY_MAX) * 100}%`;
    this.q('.meter--energy .meter-text').textContent = `${d.stats.energy} / ${ENERGY_MAX}`;
    this.q('.meter--xp .meter-label').textContent = t('hud.xp');
    this.q<HTMLElement>('.meter--xp .meter-fill').style.width = `${Math.min(100, (d.stats.xp / need) * 100)}%`;
    this.q('.meter--xp .meter-text').textContent = `${d.stats.xp} / ${need}`;
    this.q('.hud-learning span').textContent = `${t('hud.learning')}: ${LANGUAGE_NAMES[d.profile.targetLanguage]}`;
    this.el.querySelectorAll<HTMLButtonElement>('.menu-btn').forEach((b) => {
      const label = t(b.dataset.k as StringKey);
      b.querySelector('.menu-label')!.textContent = label;
      b.setAttribute('aria-label', label);
    });
    const touch = document.body.classList.contains('is-touch');
    this.q('.hud-hint').textContent = touch ? t('hint.touch') : t('hint.keyboard');
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
