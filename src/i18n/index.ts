/**
 * UI strings (menus, HUD, prompts). The first release ships English UI only (GAME_DESIGN §10).
 * Learning content and lesson explanations live in content packs, never here.
 * To add a UI language later: add a table with the same keys and list it in UI_LANGUAGES.
 */
import type { TargetLanguage } from '../learning/types';
import { en } from './en';

export const UI_LANGUAGES = ['en'] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

export type StringKey = keyof typeof en;
export type StringTable = Record<StringKey, string>;

const tables: Record<UiLanguage, StringTable> = { en };

/** Endonyms: each language is shown in its own name. */
export const LANGUAGE_NAMES: Record<TargetLanguage, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語',
  'zh-TW': '繁體中文（台灣）',
};

let current: UiLanguage = 'en';

export function setUiLanguage(lang: UiLanguage): void {
  current = lang;
  document.documentElement.lang = lang;
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let s = tables[current][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
