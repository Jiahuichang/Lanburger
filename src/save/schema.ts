import type { Facing } from '../character/types';
import type { MasteryRecord, SupportLanguage, TargetLanguage } from '../learning/types';
import type { QuestProgress } from '../npc/types';

/** Bump when the shape changes and add a migration in SaveSystem.migrate(). */
export const SAVE_VERSION = 2;
export const SAVE_KEY = 'linguaquest.save';

export const START_MAP = 'hello-town';

export type BurgerStage = 'slider' | 'classic' | 'double' | 'deluxe';

export interface SaveData {
  version: number;
  profile: {
    name: string;
    targetLanguage: TargetLanguage;
    /** Language of lesson explanations (menus stay English). */
    supportLanguage: SupportLanguage;
    createdAt: number;
  };
  location: {
    mapId: string;
    x: number;
    y: number;
    facing: Facing;
  };
  stats: {
    level: number;
    xp: number;
    energy: number;
    energyUpdatedAt: number;
    coins: number;
  };
  burger: {
    stage: BurgerStage;
    toppings: string[];
    equipped: string[];
  };
  inventory: Record<string, number>;
  quests: Record<string, QuestProgress>;
  vocabulary: Record<string, MasteryRecord>;
  /** Lit Word Lanterns (topic ids). */
  lanterns: string[];
  /** Topic id → stars (0–3). */
  topicMastery: Record<string, number>;
  unlockedRegions: string[];
  unlockedBuildings: string[];
  seenDialogues: string[];
  flags: Record<string, boolean | number | string>;
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

/** A Traditional-Chinese browser most likely wants to learn English with zh-TW explanations. */
function guessLanguages(): { target: TargetLanguage; support: SupportLanguage } {
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('zh')) return { target: 'en', support: 'zh-TW' };
  if (nav.startsWith('es')) return { target: 'en', support: 'en' };
  return { target: 'es', support: 'en' };
}

export function defaultSave(now = Date.now()): SaveData {
  const lang = guessLanguages();
  return {
    version: SAVE_VERSION,
    profile: { name: 'Lanburger', targetLanguage: lang.target, supportLanguage: lang.support, createdAt: now },
    location: { mapId: START_MAP, x: NaN, y: NaN, facing: 'down' },
    stats: { level: 1, xp: 0, energy: ENERGY_MAX, energyUpdatedAt: now, coins: 0 },
    burger: { stage: 'slider', toppings: [], equipped: [] },
    inventory: {},
    quests: {},
    vocabulary: {},
    lanterns: [],
    topicMastery: {},
    unlockedRegions: [START_MAP],
    unlockedBuildings: ['town-hall', 'language-academy'],
    seenDialogues: [],
    flags: {},
    settings: { musicVolume: 0.7, sfxVolume: 0.8, reducedMotion: false },
  };
}
