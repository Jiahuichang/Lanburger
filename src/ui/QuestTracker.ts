import type { Services } from '../core/Services';
import type { QuestDefinition } from '../npc/types';
import { QUESTS } from '../content/quests';
import { stepProgress } from '../quest/QuestSystem';
import { t } from '../i18n';
import { icons } from './icons';

type Tab = 'main' | 'side';

/** Steps shown at once: the last finished one, the current one and what comes next. */
const WINDOW = 4;

/**
 * The quest tracker under the HUD badge (reference image): Main / Side tabs, the quest title and its
 * steps with counters. Reads the save; quest rules live in QuestSystem. Tap the title to fold it away.
 */
export class QuestTracker {
  private el: HTMLElement;
  private tab: Tab = 'main';
  private collapsed = false;
  /** Step ids that just finished, flashed once. */
  private flash = new Set<string>();

  constructor(parent: HTMLElement, private s: Services) {
    this.el = document.createElement('div');
    this.el.className = 'quest-tracker panel';
    parent.append(this.el);
    s.save.onChange(() => this.render());
    s.events.on('quest:changed', ({ changes }) => {
      for (const c of changes) if (c.kind === 'step') this.flash.add(`${c.quest.id}/${c.step.id}`);
      if (changes.some((c) => c.kind === 'started' && c.quest.kind === 'side')) this.tab = 'side';
      this.render();
      window.setTimeout(() => {
        this.flash.clear();
        this.render();
      }, 1600);
    });
    this.el.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'tab') this.tab = b.dataset.tab as Tab;
      if (b.dataset.act === 'fold') this.collapsed = !this.collapsed;
      this.render();
    });
    this.render();
  }

  /** Hidden while a conversation or lesson has the screen. */
  setVisible(on: boolean): void {
    this.el.classList.toggle('is-hidden', !on);
  }

  render(): void {
    const d = this.s.save.data;
    const active = QUESTS.filter((q) => d.quests[q.id]?.status === 'active');
    const main = active.filter((q) => q.kind !== 'side');
    const side = active.filter((q) => q.kind === 'side');
    const list = this.tab === 'main' ? main : side;
    const tab = (id: Tab, label: string, n: number) =>
      `<button type="button" class="qt-tab ${this.tab === id ? 'is-on' : ''}" data-act="tab" data-tab="${id}">${label}${n ? `<span class="qt-count">${n}</span>` : ''}</button>`;

    let body = '';
    if (!list.length) {
      body = `<p class="qt-empty">${esc(this.tab === 'main' ? t('quest.allDone') : t('quest.noSide'))}</p>`;
    } else {
      const q = list[0];
      body = `<button type="button" class="qt-title" data-act="fold" aria-label="${esc(t('quest.toggle'))}"><span class="qt-mark">!</span><span>${esc(q.title)}</span><span class="qt-fold">${this.collapsed ? '▸' : '▾'}</span></button>`;
      if (!this.collapsed) body += this.steps(q);
    }
    this.el.innerHTML = `<div class="qt-tabs">${tab('main', t('quest.main'), 0)}${tab('side', t('quest.side'), side.length)}</div>${body}`;
  }

  private steps(q: QuestDefinition): string {
    const d = this.s.save.data;
    const idx = d.quests[q.id]?.stepIndex ?? 0;
    const from = Math.max(0, Math.min(idx - 1, q.steps.length - WINDOW));
    const rows = q.steps.slice(from, from + WINDOW).map((step, k) => {
      const i = from + k;
      const done = i < idx;
      const current = i === idx;
      const p = stepProgress(step, d, current, done);
      const cls = ['qt-step', done ? 'is-done' : '', current ? 'is-current' : '', this.flash.has(`${q.id}/${step.id}`) ? 'is-flash' : ''].join(' ');
      return `<li class="${cls}"><span class="qt-box">${done ? icons.check : ''}</span><span class="qt-text">${esc(step.description)}</span><span class="qt-num">${p.have}/${p.need}</span></li>`;
    });
    return `<ul class="qt-steps">${rows.join('')}</ul>`;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
