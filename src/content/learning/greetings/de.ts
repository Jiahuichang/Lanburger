import type { Pack } from '../../../learning/content';

/** Greetings in German. Needs native-speaker review before release (LEARNING_SYSTEM §6). */
export const de: Pack = {
  topic: 'greetings',
  language: 'de',
  reviewed: false,
  forms: {
    hello: { text: 'Hallo!' },
    'good-morning': { text: 'Guten Morgen!' },
    goodbye: { text: 'Tschüss!' },
    'thank-you': { text: 'Danke!' },
    'my-name-is': { text: 'Ich heiße Lanburger.' },
    'whats-your-name': { text: 'Wie heißt du?' },
    'nice-to-meet-you': { text: 'Freut mich.' },
    'how-are-you': { text: "Wie geht's?" },
    'im-fine': { text: "Mir geht's gut, danke." },
  },
  notes: {
    'greetings-1': {
      en: 'Tschüss is a casual goodbye. In formal situations, say Auf Wiedersehen.',
      'zh-TW': 'Tschüss 是比較輕鬆的再見；正式場合要說 Auf Wiedersehen。',
    },
    'greetings-2': {
      en: 'Wie heißt du? is for friends (du). The polite form is Wie heißen Sie?',
      'zh-TW': 'Wie heißt du? 是對朋友的說法（du）；禮貌的說法是 Wie heißen Sie?',
    },
    'greetings-3': {
      en: "Wie geht's? is short for Wie geht es dir?",
      'zh-TW': "Wie geht's? 是 Wie geht es dir? 的簡短說法。",
    },
  },
};
