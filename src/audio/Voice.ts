import type { TargetLanguage } from '../learning/types';

/**
 * Device text-to-speech for the target language (Web Speech API). No audio files (SPANISH_CURRICULUM
 * §7-5). Spanish prefers Latin American voices: es-MX, then es-US, then es-419, then any Spanish voice
 * that is not es-ES, and es-ES only as a last resort (§7.1).
 */
const PREFERRED: Record<TargetLanguage, string[]> = {
  en: ['en-US', 'en-GB'],
  es: ['es-MX', 'es-US', 'es-419'],
  de: ['de-DE'],
  ja: ['ja-JP'],
  'zh-TW': ['zh-TW'],
};

/** The tag set on an utterance when no matching voice is installed. */
const FALLBACK_TAG: Record<TargetLanguage, string> = { en: 'en-US', es: 'es-MX', de: 'de-DE', ja: 'ja-JP', 'zh-TW': 'zh-TW' };

const norm = (tag: string) => tag.replace('_', '-').toLowerCase();

export function pickVoice(voices: SpeechSynthesisVoice[], lang: TargetLanguage): SpeechSynthesisVoice | undefined {
  const list = voices.map((v) => ({ v, tag: norm(v.lang) }));
  for (const want of PREFERRED[lang].map(norm)) {
    const hit = list.find((x) => x.tag === want);
    if (hit) return hit.v;
  }
  const base = norm(FALLBACK_TAG[lang]).split('-')[0];
  if (lang === 'es') {
    const other = list.find((x) => x.tag.startsWith('es') && x.tag !== 'es-es');
    if (other) return other.v;
  }
  if (lang === 'zh-TW') return list.find((x) => x.tag === 'zh-hant' || x.tag.startsWith('zh-tw'))?.v ?? list.find((x) => x.tag.startsWith('zh'))?.v;
  return list.find((x) => x.tag.startsWith(base))?.v;
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/**
 * Can this device say something in `lang`? Voices often load late, so an empty voice list counts as yes
 * (the utterance then uses the language tag and the browser's default voice).
 */
export function canSpeak(lang: TargetLanguage): boolean {
  if (!speechAvailable()) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.length === 0 || !!pickVoice(voices, lang);
}

export function speak(text: string, lang: TargetLanguage, rate = 0.85): void {
  if (!speechAvailable()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(synth.getVoices(), lang);
  if (v) u.voice = v;
  u.lang = v?.lang ?? FALLBACK_TAG[lang];
  u.rate = rate;
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

// Some browsers only fill the voice list after this is asked once.
if (speechAvailable()) window.speechSynthesis.getVoices();
