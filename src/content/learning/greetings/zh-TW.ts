import type { Pack } from '../../../learning/content';

/** Greetings in Traditional Chinese (Taiwan). Needs native-speaker review before release (LEARNING_SYSTEM §6). */
export const zhTW: Pack = {
  topic: 'greetings',
  language: 'zh-TW',
  reviewed: false,
  forms: {
    hello: { text: '你好！', reading: 'nǐ hǎo' },
    'good-morning': { text: '早安！', reading: 'zǎo ān' },
    goodbye: { text: '再見！', reading: 'zàijiàn' },
    'thank-you': { text: '謝謝！', reading: 'xièxie' },
    'my-name-is': { text: '我叫 Lanburger。', reading: 'wǒ jiào Lanburger' },
    'whats-your-name': { text: '你叫什麼名字？', reading: 'nǐ jiào shénme míngzi?' },
    'nice-to-meet-you': { text: '很高興認識你。', reading: 'hěn gāoxìng rènshì nǐ' },
    'how-are-you': { text: '你好嗎？', reading: 'nǐ hǎo ma?' },
    'im-fine': { text: '我很好，謝謝。', reading: 'wǒ hěn hǎo, xièxie' },
  },
  notes: {
    'greetings-1': {
      en: 'Chinese has tones! In 你好 both words are third tone, so the first one is said as a rising second tone: ní hǎo.',
      'zh-TW': '「你好」兩個字都是三聲，連在一起說時，第一個字要唸成二聲：ní hǎo。',
    },
    'greetings-2': {
      en: "我叫… means 'I am called…'. 什麼 (shénme) means 'what'.",
      'zh-TW': '「我叫…」就是介紹自己的名字；「什麼」是 what 的意思。',
    },
    'greetings-3': {
      en: 'Put 嗎 (ma) at the end of a sentence to turn it into a yes/no question.',
      'zh-TW': '句尾加上「嗎」，就變成可以用是或不是回答的問句。',
    },
  },
};
