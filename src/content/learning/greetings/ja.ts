import type { Pack } from '../../../learning/content';

/** Greetings in Japanese. Needs native-speaker review before release (LEARNING_SYSTEM §6). */
export const ja: Pack = {
  topic: 'greetings',
  language: 'ja',
  reviewed: false,
  forms: {
    hello: { text: 'こんにちは！', reading: 'konnichiwa' },
    'good-morning': { text: 'おはようございます！', reading: 'ohayō gozaimasu' },
    goodbye: { text: 'さようなら！', reading: 'sayōnara' },
    'thank-you': { text: 'ありがとう！', reading: 'arigatō' },
    'my-name-is': { text: 'わたしはランバーガーです。', reading: 'watashi wa Ranbāgā desu' },
    'whats-your-name': { text: 'お名前は？', reading: 'おなまえは？ · o-namae wa?' },
    'nice-to-meet-you': { text: 'はじめまして。', reading: 'hajimemashite' },
    'how-are-you': { text: 'お元気ですか？', reading: 'おげんきですか？ · o-genki desu ka?' },
    'im-fine': { text: '元気です。ありがとう。', reading: 'げんきです。ありがとう。 · genki desu. arigatō.' },
  },
  notes: {
    'greetings-1': {
      en: 'おはようございます is the polite form. Between friends, おはよう is enough.',
      'zh-TW': 'おはようございます 是禮貌的說法；朋友之間說 おはよう 就可以了。',
    },
    'greetings-2': {
      en: 'はじめまして is only said the first time you meet someone.',
      'zh-TW': 'はじめまして 只在第一次見面時說。',
    },
    'greetings-3': {
      en: "Japanese often leaves out 'you'. お元気ですか？ is already polite.",
      'zh-TW': '日文常常省略「你」。お元気ですか？ 本身就很有禮貌。',
    },
  },
};
