import type { Services } from '../core/Services';
import { QUESTS } from '../content/quests';
import { ITEMS, TOPPING_INFO } from '../content/items';
import { lanternsOn, topicName } from '../content/places';
import { TOPICS, packFor } from '../content/learning';
import { learned } from '../learning/Srs';
import { stepProgress } from '../quest/QuestSystem';
import { START_MAP } from '../save/schema';
import { LANGUAGE_NAMES, t, type StringKey } from '../i18n';
import { icons } from './icons';

/**
 * The HUD's Quests, Bag and Collection sheets (PROGRESSION_SYSTEM §1, §5.2, §8). Each one is a modal card
 * re-built from the save every time it opens; the Bag is the only one that changes anything (toppings).
 */
abstract class SheetPanel {
  protected el: HTMLElement;
  protected body: HTMLElement;
  private _open = false;

  constructor(
    parent: HTMLElement,
    protected s: Services,
    private titleKey: StringKey,
    cls: string,
    /** The HUD button whose "new" dot this sheet clears. */
    private badgeKey: StringKey,
  ) {
    this.el = document.createElement('div');
    this.el.className = `modal sheet sheet--${cls}`;
    this.el.innerHTML = `
      <div class="modal-card sheet-card panel" role="dialog" aria-modal="true">
        <div class="modal-head"><h2 class="modal-title"></h2><button class="icon-btn icon-btn--small modal-x" type="button">${icons.close}</button></div>
        <div class="sheet-body"></div>
      </div>`;
    parent.append(this.el);
    this.body = this.el.querySelector('.sheet-body')!;
    this.el.querySelector('.modal-x')!.addEventListener('click', () => this.close());
    this.el.addEventListener('pointerdown', (e) => {
      if (e.target === this.el) this.close();
    });
    window.addEventListener('keydown', (e) => {
      if (this._open && (e.code === 'Escape' || e.code === 'KeyE')) {
        e.preventDefault();
        this.close();
      }
    });
  }

  get isOpen(): boolean {
    return this._open;
  }

  open(): void {
    this._open = true;
    this.el.querySelector('.modal-title')!.textContent = t(this.titleKey);
    this.el.querySelector('.modal-x')!.setAttribute('aria-label', t('panel.close'));
    this.render();
    this.el.classList.add('is-open');
    this.s.input.enabled = false;
    this.s.ui.hud.setBadge(this.badgeKey, false);
  }

  close(): void {
    if (!this._open) return;
    this._open = false;
    this.el.classList.remove('is-open');
    this.s.input.enabled = true;
  }

  protected abstract render(): void;
}

export class QuestsPanel extends SheetPanel {
  constructor(parent: HTMLElement, s: Services) {
    super(parent, s, 'quests.title', 'quests', 'hud.quests');
  }

  protected render(): void {
    const d = this.s.save.data;
    const active = QUESTS.filter((q) => d.quests[q.id]?.status === 'active');
    const done = QUESTS.filter((q) => d.quests[q.id]?.status === 'complete');
    let html = '';
    if (!active.length && !done.length) html = `<p class="sheet-empty">${esc(t('quests.none'))}</p>`;
    if (active.length) {
      html += `<h3 class="sheet-h">${esc(t('quests.active'))}</h3>`;
      for (const q of active) {
        const idx = d.quests[q.id].stepIndex;
        const steps = q.steps
          .map((st, i) => {
            const p = stepProgress(st, d, i === idx, i < idx);
            return `<li class="${i < idx ? 'is-done' : i === idx ? 'is-current' : ''}"><span class="qt-box">${i < idx ? icons.check : ''}</span><span>${esc(st.description)}</span><span class="qt-num">${p.have}/${p.need}</span></li>`;
          })
          .join('');
        const reward = q.rewards.coins ? t('quests.rewardCoins', { xp: q.rewards.xp, coins: q.rewards.coins }) : t('quests.reward', { xp: q.rewards.xp });
        html += `<article class="quest-card"><div class="quest-kind">${esc(t(q.kind === 'side' ? 'quest.side' : 'quest.main'))}</div><h4>${esc(q.title)}</h4><p>${esc(q.summary)}</p><ul class="quest-steps">${steps}</ul><div class="quest-reward">${esc(reward)}</div></article>`;
      }
    }
    if (done.length) {
      html += `<h3 class="sheet-h">${esc(t('quests.done'))}</h3><ul class="sheet-list">`;
      for (const q of done) html += `<li><span class="qt-box">${icons.check}</span>${esc(q.title)}</li>`;
      html += '</ul>';
    }
    this.body.innerHTML = html;
  }
}

export class BagPanel extends SheetPanel {
  constructor(parent: HTMLElement, s: Services) {
    super(parent, s, 'bag.title', 'bag', 'hud.bag');
    this.body.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-topping]');
      if (!b) return;
      const id = b.dataset.topping!;
      this.s.progress.setEquipped(id, !this.s.save.data.burger.equipped.includes(id));
      this.render();
    });
  }

  protected render(): void {
    const d = this.s.save.data;
    const stage = d.burger.stage[0].toUpperCase() + d.burger.stage.slice(1);
    let html = `<div class="bag-row"><span class="bag-coin">${icons.coin}</span><span class="bag-label">${esc(t('bag.coins'))}</span><strong>${d.stats.coins}</strong></div>`;
    html += `<p class="sheet-note">${esc(t('bag.stage', { stage }))}</p>`;
    html += `<h3 class="sheet-h">${esc(t('bag.toppings'))}</h3>`;
    const owned = Object.keys(TOPPING_INFO).filter((id) => d.burger.toppings.includes(id));
    if (!owned.length) html += `<p class="sheet-empty">${esc(t('bag.toppingsNone'))}</p>`;
    else {
      html += '<div class="bag-toppings">';
      for (const id of owned) {
        const on = d.burger.equipped.includes(id);
        html += `<button type="button" class="topping-btn ${on ? 'is-on' : ''}" data-topping="${id}" aria-pressed="${on}"><span class="topping-icon">${icons.leaf}</span><span>${esc(TOPPING_INFO[id].name)}</span><span class="topping-state">${esc(t(on ? 'bag.toppingOn' : 'bag.toppingOff'))}</span></button>`;
      }
      html += '</div>';
    }
    html += `<h3 class="sheet-h">${esc(t('bag.items'))}</h3>`;
    const items = Object.entries(d.inventory).filter(([id, n]) => n > 0 && ITEMS[id]);
    if (!items.length) html += `<p class="sheet-empty">${esc(t('bag.empty'))}</p>`;
    else {
      html += '<ul class="item-list">';
      for (const [id, n] of items) {
        const it = ITEMS[id];
        html += `<li><span class="item-icon">${icons[it.icon]}</span><div><strong>${esc(it.name)}${n > 1 ? ` ×${n}` : ''}</strong><p>${esc(it.description)}</p></div></li>`;
      }
      html += '</ul>';
    }
    this.body.innerHTML = html;
  }
}

export class CollectionPanel extends SheetPanel {
  constructor(parent: HTMLElement, s: Services) {
    super(parent, s, 'collection.title', 'collection', 'hud.collection');
  }

  protected render(): void {
    const d = this.s.save.data;
    const lang = d.profile.targetLanguage;
    let html = `<h3 class="sheet-h">${esc(t('collection.lanterns'))} · ${d.lanterns.length}/${lanternsOn(START_MAP).length}</h3><ul class="lantern-list">`;
    for (const l of lanternsOn(START_MAP)) {
      const lit = d.lanterns.includes(l.topic);
      const stars = d.topicMastery[l.topic] ?? 0;
      const open = !!TOPICS[l.topic];
      html += `<li class="${lit ? 'is-lit' : ''}"><span class="lantern-icon">${icons.lantern}</span><span class="lantern-name">${esc(topicName(l.topic))}</span><span class="stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>${open ? '' : `<span class="soon">${esc(t('collection.soon'))}</span>`}</li>`;
    }
    html += '</ul>';
    html += `<h3 class="sheet-h">${esc(t('collection.phrases', { lang: LANGUAGE_NAMES[lang] }))}</h3>`;
    const known = learned(d.vocabulary, lang);
    if (!known.length) html += `<p class="sheet-empty">${esc(t('collection.noPhrases'))}</p>`;
    else {
      html += '<ul class="phrase-list">';
      for (const topic of Object.values(TOPICS)) {
        const pack = packFor(topic.id, lang);
        for (const item of topic.items) {
          if (!known.includes(item.id) || !pack?.forms[item.id]) continue;
          const box = d.vocabulary[`${lang}:${item.id}`]?.box ?? 0;
          html += `<li><span class="target" lang="${lang}">${esc(pack.forms[item.id].text)}</span><span class="phrase-meaning" lang="${d.profile.supportLanguage}">${esc(item.meaning[d.profile.supportLanguage])}</span><span class="phrase-box" title="Box ${box}">${'●'.repeat(box)}${'○'.repeat(5 - box)}</span></li>`;
        }
      }
      html += '</ul>';
    }
    const keep = Object.entries(d.inventory).filter(([id, n]) => n > 0 && ITEMS[id]?.kind === 'keepsake');
    if (keep.length) {
      html += `<h3 class="sheet-h">${esc(t('collection.keepsakes'))}</h3><ul class="item-list">`;
      for (const [id] of keep) html += `<li><span class="item-icon">${icons[ITEMS[id].icon]}</span><div><strong>${esc(ITEMS[id].name)}</strong></div></li>`;
      html += '</ul>';
    }
    this.body.innerHTML = html;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
