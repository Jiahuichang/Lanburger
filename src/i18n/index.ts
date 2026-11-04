/**
 * UI strings (menus, HUD, prompts). This is the UI language — NOT learning content.
 * Learning content lives in content packs (LEARNING_DESIGN §8).
 */
import type { LanguageCode } from '../learning/types';
import { en } from './en';
import { es } from './es';
import { de } from './de';
import { fr } from './fr';
import { zhTW } from './zh-TW';

export type StringKey = keyof typeof en;
export type StringTable = Record<StringKey, string>;

const tables: Record<LanguageCode, StringTable> = { en, es, de, fr, 'zh-TW': zhTW };

/** Endonyms: each language is always shown in its own name. */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  'zh-TW': '繁體中文（台灣）',
};

let current: LanguageCode = 'en';

export function setUiLanguage(lang: LanguageCode): void {
  current = lang;
  document.documentElement.lang = lang;
}

export function uiLanguage(): LanguageCode {
  return current;
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let s = tables[current][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
