import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/Services';
import type { SaveSystem } from '../save/SaveSystem';
import type { UiRoot } from '../ui/UiRoot';
import { QUESTS } from '../content/quests';
import { ITEMS, TOPPING_INFO } from '../content/items';
import { TOPIC_IDS, topicFor } from '../content/learning';
import { evaluate, type QuestChange, type QuestEvent } from '../quest/QuestSystem';
import { addXp, topicStars, unitComplete, XP } from './Progression';
import { lanternsOn, placeName, topicName } from '../content/places';
import { START_MAP } from '../save/schema';
import { t } from '../i18n';

/**
 * Glue between progress rules and the rest of the game (PROGRESSION_SYSTEM): quests, XP, level ups,
 * topic stars and unlocks. Pure rules live in QuestSystem and Progression; this applies them to the
 * save, tells the world through events and shows celebrations. It never touches Three.js.
 */
export class ProgressDirector {
  constructor(
    private save: SaveSystem,
    private events: EventBus<GameEvents>,
    private ui: UiRoot,
  ) {}

  /** Give XP (halved, min 1, when `halved`). Handles level ups and growth. */
  gainXp(amount: number, halved = false): void {
    const n = halved ? Math.max(1, Math.floor(amount / 2)) : amount;
    if (n <= 0) return;
    let res!: ReturnType<typeof addXp>;
    this.save.update((d) => void (res = addXp(d, n)));
    this.events.emit('progress:xp', { amount: n });
    for (const level of res.levels) {
      this.events.emit('progress:level', { level });
      this.ui.celebrate({ title: t('level.up'), body: t('level.upBody', { n: level }), kind: 'level' });
    }
    if (res.stage) {
      this.events.emit('hero:changed', undefined);
      this.ui.celebrate({ title: t('growth.title'), body: t(`growth.${res.stage}`), kind: 'growth' });
    }
  }

  /**
   * Re-check topics and quests after anything that may count: a conversation (`ev` = who was talked to),
   * a finished lesson, a place explored. `quiet` skips the small step toasts (used at boot).
   */
  refresh(ev?: QuestEvent, quiet = false): void {
    this.checkTopics();
    let changes: QuestChange[] = [];
    this.save.update((d) => void (changes = evaluate(QUESTS, d, ev)));
    if (!changes.length) return;
    this.events.emit('quest:changed', { changes });
    for (const c of changes) {
      if (c.kind === 'started') {
        this.ui.celebrate({ title: t('quest.new'), body: c.quest.title, kind: 'quest' });
      } else if (c.kind === 'step') {
        this.gainXp(XP.questStep);
        if (!quiet) this.ui.toast(t('quest.stepDone', { step: c.step.description }));
      } else {
        this.ui.celebrate({ title: t('quest.complete'), body: c.quest.title, kind: 'quest' });
        this.reward(c.quest.rewards);
      }
    }
    this.save.flush();
  }

  /**
   * Stars per topic for the current language (mastery); the first star of a topic is worth XP (§4, §6).
   * Also marks finished curriculum units ("unit:<id>": lessons and practice chat done).
   */
  checkTopics(): void {
    const d = this.save.data;
    const lang = d.profile.targetLanguage;
    for (const id of TOPIC_IDS) {
      const topic = topicFor(id, lang);
      if (!topic) continue;
      for (const unit of topic.units ?? []) {
        if (d.flags[`unit:${unit.id}`] || !unitComplete(unit, d)) continue;
        this.save.update((s) => void (s.flags[`unit:${unit.id}`] = true));
        this.ui.celebrate({ title: t('unit.done'), body: t('learn.unitLabel', { n: unit.number, title: unit.title }), kind: 'quest' });
        this.gainXp(XP.questStep);
      }
      const stars = topicStars(topic, d, lang);
      const before = d.topicMastery[topic.id] ?? 0;
      if (stars <= before) continue;
      this.save.update((s) => void (s.topicMastery[topic.id] = stars));
      this.ui.celebrate({ title: t('star.title'), body: `${topic.name} ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, kind: 'star' });
      if (before === 0) this.gainXp(XP.topicStar);
    }
  }

  private reward(r: { xp: number; coins?: number; items?: Record<string, number>; unlocks?: string[] }): void {
    this.save.update((d) => {
      d.stats.coins += r.coins ?? 0;
      for (const [id, n] of Object.entries(r.items ?? {})) d.inventory[id] = (d.inventory[id] ?? 0) + n;
    });
    if (r.coins) this.ui.toast(t('reward.coins', { n: r.coins }));
    for (const id of Object.keys(r.items ?? {})) {
      const item = ITEMS[id];
      if (item) this.ui.celebrate({ title: t('reward.item'), body: item.name, kind: 'item' });
    }
    for (const u of r.unlocks ?? []) this.unlock(u);
    this.gainXp(r.xp);
  }

  /** "lantern:<topic>", "topping:<id>" or "building:<id>". */
  unlock(key: string): void {
    const [kind, id] = key.split(':');
    const d = this.save.data;
    if (kind === 'lantern' && !d.lanterns.includes(id)) {
      this.save.update((s) => void s.lanterns.push(id));
      this.events.emit('lantern:lit', { topic: id });
      this.ui.celebrate({
        title: t('lantern.litTitle'),
        body: t('lantern.litBody', { topic: topicName(id), n: this.save.data.lanterns.length, total: lanternsOn(START_MAP).length }),
        kind: 'lantern',
      });
    } else if (kind === 'topping' && !d.burger.toppings.includes(id)) {
      this.save.update((s) => {
        s.burger.toppings.push(id);
        if (!s.burger.equipped.includes(id)) s.burger.equipped.push(id);
      });
      this.events.emit('hero:changed', undefined);
      this.ui.celebrate({ title: t('topping.title'), body: t('topping.body', { name: TOPPING_INFO[id]?.name ?? id }), kind: 'topping' });
    } else if (kind === 'building' && !d.unlockedBuildings.includes(id)) {
      this.save.update((s) => void s.unlockedBuildings.push(id));
      this.ui.celebrate({ title: t('building.title'), body: t('building.body', { name: placeName(id) }), kind: 'building' });
    }
  }

  /** Show or hide an earned topping (Bag). */
  setEquipped(id: string, on: boolean): void {
    this.save.update((s) => {
      if (!s.burger.toppings.includes(id)) return;
      s.burger.equipped = s.burger.equipped.filter((x) => x !== id);
      if (on) s.burger.equipped.push(id);
    });
    this.save.flush();
    this.events.emit('hero:changed', undefined);
  }
}
