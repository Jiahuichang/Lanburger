import { FACINGS } from '../character/types';
import { SUPPORT_LANGUAGES, TARGET_LANGUAGES } from '../learning/types';
import { defaultSave, ENERGY_MAX, ENERGY_REGEN_MS, SAVE_KEY, SAVE_VERSION, START_MAP, type SaveData } from './schema';

const AUTOSAVE_MS = 5000;

/**
 * Local progress persistence. Never throws on bad data: corrupt or unknown saves fall back to
 * defaults, older versions are migrated, and storage errors (private mode) are ignored.
 */
export class SaveSystem {
  private _data: SaveData;
  private dirty = false;
  private listeners = new Set<() => void>();

  constructor(private storage: Storage | null = safeStorage()) {
    this._data = this.load();
    applyEnergyRegen(this._data, Date.now());
    window.setInterval(() => this.flushIfDirty(), AUTOSAVE_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('pagehide', () => this.flush());
  }

  get data(): Readonly<SaveData> {
    return this._data;
  }

  /** Mutate the save. Marks it dirty and notifies listeners (HUD etc.). */
  update(fn: (d: SaveData) => void, notify = true): void {
    fn(this._data);
    this.dirty = true;
    if (notify) this.listeners.forEach((l) => l());
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  flush(): void {
    this.dirty = false;
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify(this._data));
    } catch {
      /* storage full or unavailable — progress stays in memory */
    }
  }

  reset(): void {
    this._data = defaultSave();
    this.flush();
    this.listeners.forEach((l) => l());
  }

  private flushIfDirty(): void {
    if (this.dirty) this.flush();
  }

  private load(): SaveData {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      return migrate(JSON.parse(raw));
    } catch {
      return defaultSave();
    }
  }
}

/** Upgrade any older save to SAVE_VERSION, filling missing fields from defaults. */
export function migrate(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  let r = raw as Record<string, any>;
  if ((r.version ?? 1) < 2) r = migrateV1toV2(r);

  const merged: SaveData = {
    ...base,
    ...r,
    version: SAVE_VERSION,
    profile: { ...base.profile, ...r.profile },
    location: { ...base.location, ...r.location },
    stats: { ...base.stats, ...r.stats },
    burger: { ...base.burger, ...r.burger },
    settings: { ...base.settings, ...r.settings },
    inventory: { ...(r.inventory ?? {}) },
    quests: { ...(r.quests ?? {}) },
    vocabulary: { ...(r.vocabulary ?? {}) },
    topicMastery: { ...(r.topicMastery ?? {}) },
    flags: { ...(r.flags ?? {}) },
    lanterns: arr(r.lanterns, base.lanterns),
    unlockedRegions: arr(r.unlockedRegions, base.unlockedRegions),
    unlockedBuildings: arr(r.unlockedBuildings, base.unlockedBuildings),
    seenDialogues: arr(r.seenDialogues, base.seenDialogues),
  };
  const p = merged.profile;
  if (!(TARGET_LANGUAGES as readonly unknown[]).includes(p.targetLanguage)) p.targetLanguage = base.profile.targetLanguage;
  if (!(SUPPORT_LANGUAGES as readonly unknown[]).includes(p.supportLanguage)) p.supportLanguage = base.profile.supportLanguage;
  if (!(FACINGS as readonly unknown[]).includes(merged.location.facing)) merged.location.facing = 'down';
  if (!Number.isFinite(merged.location.x) || !Number.isFinite(merged.location.y)) {
    merged.location = { ...base.location, mapId: merged.location.mapId || base.location.mapId };
  }
  return merged;
}

/**
 * v1 (Phase 1 side-scroller, Mossbrook) → v2 (top-down Hello Town).
 * v1 held no learning progress, so only the profile, stats and settings carry over.
 */
function migrateV1toV2(v1: Record<string, any>): Record<string, any> {
  const profile = v1.profile ?? {};
  const stats = v1.stats ?? {};
  const target = profile.targetLanguage === 'fr' ? undefined : profile.targetLanguage;
  return {
    version: 2,
    profile: {
      name: profile.name || 'Lanburger',
      targetLanguage: target,
      supportLanguage: profile.uiLanguage === 'zh-TW' ? 'zh-TW' : 'en',
      createdAt: profile.createdAt,
    },
    // side-scroller coordinates mean nothing on the new map: start at the Hello Town spawn
    location: { mapId: START_MAP, x: NaN, y: NaN, facing: 'down' },
    stats: { level: stats.level, xp: stats.xp, energy: stats.energy, energyUpdatedAt: stats.energyUpdatedAt, coins: stats.acorns ?? 0 },
    inventory: v1.inventory,
    quests: v1.quests,
    vocabulary: v1.vocabulary,
    settings: v1.settings,
    flags: target ? {} : { needsLanguagePick: true },
  };
}

const arr = (v: unknown, fallback: string[]): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [...fallback];

/** Energy refills over real time (GAME_DESIGN §6.2). Energy never blocks learning. */
export function applyEnergyRegen(d: SaveData, now: number): void {
  const s = d.stats;
  if (s.energy >= ENERGY_MAX) {
    s.energyUpdatedAt = now;
    return;
  }
  const gained = Math.floor((now - s.energyUpdatedAt) / ENERGY_REGEN_MS);
  if (gained > 0) {
    s.energy = Math.min(ENERGY_MAX, s.energy + gained);
    s.energyUpdatedAt += gained * ENERGY_REGEN_MS;
  }
}

function safeStorage(): Storage | null {
  try {
    const s = window.localStorage;
    s.setItem('__lq_probe', '1');
    s.removeItem('__lq_probe');
    return s;
  } catch {
    return null;
  }
}
