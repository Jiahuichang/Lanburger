import type { Pack } from '../../../learning/content';

/** Greetings in English. Needs native-speaker review before release (LEARNING_SYSTEM §6). */
export const en: Pack = {
  topic: 'greetings',
  language: 'en',
  reviewed: false,
  forms: {
    hello: { text: 'Hello!' },
    'good-morning': { text: 'Good morning!' },
    goodbye: { text: 'Goodbye!' },
    'thank-you': { text: 'Thank you!' },
    'my-name-is': { text: 'My name is Lanburger.' },
    'whats-your-name': { text: "What's your name?" },
    'nice-to-meet-you': { text: 'Nice to meet you.' },
    'how-are-you': { text: 'How are you?' },
    'im-fine': { text: "I'm fine, thanks." },
  },
  notes: {
    'greetings-1': {
      en: "'Hi' is a more casual 'Hello'. Use 'Good morning' before noon.",
      'zh-TW': 'Hi 是比較隨性的 Hello；中午以前可以說 Good morning。',
    },
    'greetings-2': {
      en: "'Nice to meet you' is only for the first time you meet someone.",
      'zh-TW': 'Nice to meet you 只在第一次見面時說。',
    },
    'greetings-3': {
      en: "'How are you?' is often just a friendly greeting. A short answer is fine!",
      'zh-TW': 'How are you? 常常只是友善的打招呼，簡短回答就可以了！',
    },
  },
};
