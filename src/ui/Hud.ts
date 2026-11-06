import type { Services } from '../core/Services';
import { LANGUAGE_NAMES, t, type StringKey } from '../i18n';
import { ENERGY_MAX, xpToNext } from '../save/schema';
import { icons } from './icons';
import type { Expression, LoadedPortrait } from '../character/types';

const MENU: { key: StringKey; icon: keyof typeof icons; cls: string }[] = [
  { key: 'hud.quests', icon: 'quests', cls: 'quests' },
  { key: 'hud.bag', icon: 'bag', cls: 'bag' },
  { key: 'hud.learn', icon: 'learn', cls: 'learn' },
  { key: 'hud.collection', icon: 'collection', cls: 'collection' },
  { key: 'hud.settings', icon: 'gear', cls: 'settings' },
];

/**
 * HUD (ART_DIRECTION §7): portrait + Lv + name + Energy/XP bars top-left; menu buttons top-right;
 * the learning chip; a controls hint. The minimap and quest tracker are separate UI pieces.
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
        <div class="hud-portrait"><canvas width="64" height="64"></canvas></div>
        <div class="hud-info">
          <div class="hud-name-row"><span class="hud-level"></span><span class="hud-name"></span></div>
          <div class="meter meter--energy" role="meter"><span class="meter-label"></span><div class="meter-track"><div class="meter-fill"></div><span class="meter-text"></span></div></div>
          <div class="meter meter--xp" role="meter"><span class="meter-label"></span><div class="meter-track"><div class="meter-fill"></div><span class="meter-text"></span></div></div>
        </div>
      </div>
      <div class="hud-menu">
        ${MENU.map((m) => `<button class="menu-btn menu-btn--${m.cls}" type="button" data-k="${m.key}"><span class="menu-icon">${icons[m.icon]}</span><span class="menu-label"></span><span class="menu-badge" hidden></span></button>`).join('')}
      </div>
      <div class="hud-chips">
        <div class="chip hud-learning"><span></span></div>
      </div>
      <div class="hud-footer"><div class="hud-hint chip"></div></div>`;
    parent.append(this.el);

    this.el.querySelectorAll<HTMLButtonElement>('.menu-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const key = b.dataset.k as StringKey;
        if (this.s.ui.dialogue.isOpen || this.s.ui.anyPanelOpen) return;
        if (key === 'hud.settings') this.s.ui.settings.open();
        else if (key === 'hud.learn') this.s.events.emit('ui:learn', undefined);
        else if (key === 'hud.quests') this.s.ui.quests.open();
        else if (key === 'hud.bag') this.s.ui.bag.open();
        else if (key === 'hud.collection') this.s.ui.collection.open();
      });
    });
    s.save.onChange(() => this.refresh());
    // a red dot on Quests / Bag / Collection when something new is in there (reference image)
    s.events.on('quest:changed', ({ changes }) => {
      if (changes.some((c) => c.kind === 'started' || c.kind === 'complete')) this.setBadge('hud.quests', true);
      if (changes.some((c) => c.kind === 'complete' && (c.quest.rewards.items || c.quest.rewards.unlocks?.some((u) => u.startsWith('topping:'))))) {
        this.setBadge('hud.bag', true);
      }
    });
    s.events.on('lantern:lit', () => this.setBadge('hud.collection', true));
    this.refresh();
  }

  setBadge(key: StringKey, on: boolean): void {
    const b = this.el.querySelector<HTMLElement>(`.menu-btn[data-k="${key}"] .menu-badge`);
    if (b) b.hidden = !on;
  }


  /** Draw the hero's portrait from its portrait sheet, never from a hard-coded image. */
  setPortrait(portrait: LoadedPortrait, expression: Expression): void {
    const canvas = this.q<HTMLCanvasElement>('.hud-portrait canvas');
    const S = portrait.manifest.size;
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, S, S);
    ctx.drawImage(portrait.sheet, portrait.manifest.expressions[expression] * S, 0, S, S, 0, 0, S, S);
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
