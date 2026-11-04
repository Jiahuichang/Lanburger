import type { LanguageCode, MasteryRecord } from '../learning/types';
import type { QuestProgress } from '../npc/types';

/** Bump when the shape changes and add a migration in SaveSystem.migrate(). */
export const SAVE_VERSION = 1;
export const SAVE_KEY = 'linguaquest.save';

export interface SaveData {
  version: number;
  profile: {
    name: string;
    uiLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    createdAt: number;
  };
  location: {
    mapId: string;
    x: number;
    y: number;
    facing: 1 | -1;
  };
  stats: {
    level: number;
    xp: number;
    energy: number;
    energyUpdatedAt: number;
    acorns: number;
  };
  inventory: Record<string, number>;
  quests: Record<string, QuestProgress>;
  vocabulary: Record<string, MasteryRecord>;
  unlockedRegions: string[];
  settings: {
    musicVolume: number;
    sfxVolume: number;
    reducedMotion: boolean;
  };
}

export const ENERGY_MAX = 20;
export const ENERGY_REGEN_MS = 3 * 60 * 1000;

export function xpToNext(level: number): number {
  return 40 + 20 * (level - 1);
}

function guessUiLanguage(): LanguageCode {
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('zh')) return 'zh-TW';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('de')) return 'de';
  if (nav.startsWith('fr')) return 'fr';
  return 'en';
}

export function defaultSave(now = Date.now()): SaveData {
  const ui = guessUiLanguage();
  return {
    version: SAVE_VERSION,
    profile: {
      name: '',
      uiLanguage: ui,
      targetLanguage: ui === 'es' ? 'en' : 'es',
      createdAt: now,
    },
    location: { mapId: 'mossbrook', x: 260, y: 0, facing: 1 },
    stats: { level: 1, xp: 0, energy: ENERGY_MAX, energyUpdatedAt: now, acorns: 0 },
    inventory: {},
    quests: {},
    vocabulary: {},
    unlockedRegions: ['mossbrook'],
    settings: { musicVolume: 0.7, sfxVolume: 0.8, reducedMotion: false },
  };
}
