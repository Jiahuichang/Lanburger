import type { Pack } from '../../../learning/content';

/** Greetings in Spanish. Needs native-speaker review before release (LEARNING_SYSTEM §6). */
export const es: Pack = {
  topic: 'greetings',
  language: 'es',
  reviewed: false,
  forms: {
    hello: { text: '¡Hola!' },
    'good-morning': { text: '¡Buenos días!' },
    goodbye: { text: '¡Adiós!' },
    'thank-you': { text: '¡Gracias!' },
    'my-name-is': { text: 'Me llamo Lanburger.' },
    'whats-your-name': { text: '¿Cómo te llamas?' },
    'nice-to-meet-you': { text: 'Mucho gusto.' },
    'how-are-you': { text: '¿Cómo estás?' },
    'im-fine': { text: 'Estoy bien, gracias.' },
  },
  notes: {
    'greetings-1': {
      en: 'In Spanish, exclamations and questions also start with an upside-down mark: ¡Hola! ¿Cómo estás?',
      'zh-TW': '西班牙文的驚嘆句和問句，開頭也要加一個倒過來的符號：¡Hola! ¿Cómo estás?',
    },
    'greetings-2': {
      en: "Me llamo… literally means 'I call myself…'.",
      'zh-TW': 'Me llamo… 字面上的意思是「我稱呼自己為…」。',
    },
    'greetings-3': {
      en: '¿Cómo estás? is for friends (tú). With older people or strangers, say ¿Cómo está usted?',
      'zh-TW': '¿Cómo estás? 是對朋友的說法（tú）；對長輩或陌生人要說 ¿Cómo está usted?',
    },
  },
};
