import { LANGUAGES } from '../learning/types';
import { defaultSave, ENERGY_MAX, ENERGY_REGEN_MS, SAVE_KEY, SAVE_VERSION, type SaveData } from './schema';

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
  const r = raw as Partial<SaveData> & { version?: number };
  // Future migrations go here, e.g.: if (r.version === 1) { ...; r.version = 2; }
  const merged: SaveData = {
    ...base,
    ...r,
    version: SAVE_VERSION,
    profile: { ...base.profile, ...r.profile },
    location: { ...base.location, ...r.location },
    stats: { ...base.stats, ...r.stats },
    settings: { ...base.settings, ...r.settings },
    inventory: { ...(r.inventory ?? {}) },
    quests: { ...(r.quests ?? {}) },
    vocabulary: { ...(r.vocabulary ?? {}) },
    unlockedRegions: Array.isArray(r.unlockedRegions) ? r.unlockedRegions : base.unlockedRegions,
  };
  // Sanity: languages must be supported and different.
  const valid = (l: unknown) => (LANGUAGES as readonly unknown[]).includes(l);
  if (!valid(merged.profile.uiLanguage)) merged.profile.uiLanguage = base.profile.uiLanguage;
  if (!valid(merged.profile.targetLanguage) || merged.profile.targetLanguage === merged.profile.uiLanguage) {
    merged.profile.targetLanguage = merged.profile.uiLanguage === 'es' ? 'en' : 'es';
  }
  if (!Number.isFinite(merged.location.x) || !Number.isFinite(merged.location.y)) merged.location = base.location;
  return merged;
}

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
