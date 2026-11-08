import type { Pack } from '../../../learning/content';

/**
 * Greetings in Spanish: units 1–2 of the Spanish syllabus (SPANISH_CURRICULUM §4, R6B). Latin American
 * Spanish, Mexican vocabulary (§7.1). The lessons are in ./es-topic.ts. Sound tips spread unit 0 over the
 * lessons. 👩‍🏫 Needs review by a Spanish teacher (Mexican usage) before release (§7-7).
 */
export const es: Pack = {
  topic: 'greetings',
  language: 'es',
  reviewed: false,
  typing: true,
  forms: {
    hello: { text: '¡Hola!' },
    goodbye: { text: '¡Adiós!' },
    'see-you-later': { text: '¡Hasta luego!' },
    'see-you-tomorrow': { text: '¡Hasta mañana!' },
    'thank-you': { text: '¡Gracias!', alts: ['¡Muchas gracias!'] },
    'good-morning': { text: '¡Buenos días!', alts: ['¡Buen día!'] },
    'good-afternoon': { text: '¡Buenas tardes!' },
    'good-night': { text: '¡Buenas noches!' },
    'how-is-it-going': { text: '¿Qué tal?' },
    'how-are-you': { text: '¿Cómo estás?', level: 'A2' },
    'im-fine': { text: 'Bien, gracias.', alts: ['Muy bien, gracias.', 'Estoy bien, gracias.', 'Bien.', 'Muy bien.'] },
    'and-you': { text: '¿Y tú?' },
    'whats-your-name': { text: '¿Cómo te llamas?' },
    'my-name-is': { text: 'Me llamo {name}.', alts: ['Soy {name}.'] },
    'i-am': { text: 'Soy {name}.', alts: ['Me llamo {name}.'] },
    'nice-to-meet-you': { text: 'Mucho gusto.', level: 'A2', alts: ['Encantado.', 'Encantada.'] },
    pleased: { text: 'Encantado.', byGender: { m: 'Encantado.', f: 'Encantada.' }, alts: ['Mucho gusto.'] },
    likewise: { text: 'Igualmente.' },
    mr: { text: 'señor' },
    mrs: { text: 'señora' },
    'whats-your-name-usted': { text: '¿Cómo se llama usted?', alts: ['¿Cómo se llama?'] },
    'how-are-you-usted': { text: '¿Cómo está usted?', level: 'A2', alts: ['¿Cómo está?'] },
    'and-you-usted': { text: '¿Y usted?' },
  },
  notes: {
    'greetings-1': {
      en: 'Spanish opens exclamations and questions with an upside-down mark: ¡Hola! ¿Qué tal? Sound tip: h is always silent.',
      'zh-TW': '西班牙文的驚嘆句和問句，開頭也要加倒過來的符號：¡Hola! ¿Qué tal? 發音小提示：h 永遠不發音。',
    },
    'greetings-2': {
      en: 'Sound tip: ñ sounds like the “ny” in canyon: mañana. In Mexico you may also hear ¡Buen día! in the morning.',
      'zh-TW': '發音小提示：ñ 的音像英文 canyon 裡的「ny」：mañana。在墨西哥，早上也常聽到 ¡Buen día!。',
    },
    'greetings-3': {
      en: 'Sound tip: the five vowels a, e, i, o, u are always short and clear. In Latin America, z and c before e or i sound like s: gracias.',
      'zh-TW': '發音小提示：a、e、i、o、u 五個母音都短而清楚。在拉丁美洲，z 和 e、i 前面的 c 都唸成 s：gracias。',
    },
    'greetings-4': {
      en: 'Sound tip: in Latin America ll sounds like y: llamo sounds like “yamo”.',
      'zh-TW': '發音小提示：在拉丁美洲，ll 唸起來像 y：llamo 聽起來像「yamo」。',
    },
    'greetings-5': {
      en: 'Sound tip: without an accent mark, stress the second-to-last syllable: en-can-TA-do, i-gual-MEN-te. An accent mark moves the stress: a-DIÓS.',
      'zh-TW': '發音小提示：沒有重音符號時，重音在倒數第二個音節：en-can-TA-do、i-gual-MEN-te。有重音符號就照符號唸：a-DIÓS。',
    },
    'greetings-6': {
      en: 'For a group, Latin America uses ustedes, friends or not. In Spain friends say vosotros: good to recognise, not needed here.',
      'zh-TW': '對一群人說「你們」，拉丁美洲不分熟不熟都用 ustedes。西班牙對朋友會說 vosotros，看得懂就好，這裡不用學。',
    },
  },
  drills: {
    'greetings-1': [
      {
        kind: 'fill',
        item: 'see-you-tomorrow',
        before: '¡Hasta ',
        answer: 'mañana',
        after: '!',
        options: ['mañana', 'luego', 'tardes'],
        context: { en: 'You will see Remy again tomorrow.', 'zh-TW': '你明天還會再見到 Remy。' },
        why: {
          luego: { en: '¡Hasta luego! means “see you later”. For tomorrow, say mañana.', 'zh-TW': '¡Hasta luego! 是「待會見」。明天才見面要說 mañana。' },
          tardes: { en: 'Tardes means afternoon, as in ¡Buenas tardes!', 'zh-TW': 'tardes 是「下午」，用在 ¡Buenas tardes!。' },
        },
      },
      { kind: 'type', item: 'hello', context: { en: 'Say hello to Remy.', 'zh-TW': '跟 Remy 打招呼。' } },
    ],
    'greetings-2': [
      {
        kind: 'fill',
        item: 'good-afternoon',
        before: '¡',
        answer: 'Buenas',
        after: ' tardes!',
        options: ['Buenos', 'Buenas', 'Bueno'],
        why: {
          Buenos: { en: 'Tardes is feminine, so it takes buenas. Only días takes buenos.', 'zh-TW': 'tardes 是陰性，所以用 buenas。只有 días 用 buenos。' },
          Bueno: { en: 'Greetings use the plural: buenas tardes.', 'zh-TW': '招呼語用複數：buenas tardes。' },
        },
      },
      {
        kind: 'fill',
        item: 'good-night',
        before: '¡Buenas ',
        answer: 'noches',
        after: '!',
        options: ['días', 'tardes', 'noches'],
        context: { en: '9 p.m. at the plaza.', 'zh-TW': '晚上 9 點，在廣場。' },
        why: {
          días: { en: 'Días is for the morning (and it is buenos días). It is 9 p.m.', 'zh-TW': 'días 是早上用的（而且要說 buenos días）。現在是晚上 9 點。' },
          tardes: { en: 'Tardes is for the afternoon, before dark. It is 9 p.m.', 'zh-TW': 'tardes 是天黑前的下午用的。現在是晚上 9 點。' },
        },
      },
      { kind: 'type', item: 'good-morning', context: { en: 'It’s 8 a.m. Greet Remy.', 'zh-TW': '早上 8 點，跟 Remy 打招呼。' } },
    ],
    'greetings-3': [
      {
        kind: 'fill',
        item: 'and-you',
        before: 'Bien, gracias. ¿Y ',
        answer: 'tú',
        after: '?',
        options: ['tú', 'yo', 'tal'],
        why: {
          yo: { en: 'Yo means “I”. To ask back, say ¿Y tú? (and you?).', 'zh-TW': 'yo 是「我」。要反問對方，說 ¿Y tú?（那你呢？）。' },
          tal: { en: 'Tal belongs in ¿Qué tal?. To ask back, say ¿Y tú?', 'zh-TW': 'tal 是 ¿Qué tal? 裡的字。要反問對方，說 ¿Y tú?。' },
        },
      },
      { kind: 'type', item: 'im-fine', context: { en: 'Remy asks: ¿Qué tal? Say you’re fine, thanks.', 'zh-TW': 'Remy 問你：¿Qué tal? 回答你很好，謝謝。' } },
    ],
    'greetings-4': [
      { kind: 'order', item: 'whats-your-name', decoy: 'se' },
      {
        kind: 'fill',
        item: 'my-name-is',
        before: 'Me ',
        answer: 'llamo',
        after: ' {name}.',
        options: ['llamo', 'llamas', 'llama'],
        why: {
          llamas: { en: 'Te llamas is “you are called”: ¿Cómo te llamas? For yourself, say me llamo.', 'zh-TW': 'te llamas 是「你叫做」：¿Cómo te llamas?。說自己要用 me llamo。' },
          llama: { en: 'Se llama is for someone else, or for usted. For yourself, say me llamo.', 'zh-TW': 'se llama 是說別人，或用在 usted。說自己要用 me llamo。' },
        },
      },
      { kind: 'type', item: 'my-name-is', context: { en: 'Remy asks your name. Answer!', 'zh-TW': 'Remy 問你的名字，回答他吧！' } },
    ],
    'greetings-5': [
      {
        kind: 'fill',
        item: 'nice-to-meet-you',
        before: 'Mucho ',
        answer: 'gusto',
        after: '.',
        options: ['gusto', 'gracias', 'tal'],
        why: {
          gracias: { en: 'Muchas gracias means “thank you very much”. To say nice to meet you: mucho gusto.', 'zh-TW': 'Muchas gracias 是「非常謝謝」。「很高興認識你」要說 mucho gusto。' },
          tal: { en: 'Tal belongs in ¿Qué tal?.', 'zh-TW': 'tal 是 ¿Qué tal? 裡的字。' },
        },
      },
      { kind: 'type', item: 'pleased', context: { en: 'You meet Theo for the first time. Say you’re pleased to meet them.', 'zh-TW': '你第一次見到 Theo，說「幸會」。' } },
    ],
    'greetings-6': [
      { kind: 'order', item: 'whats-your-name-usted', decoy: 'te' },
      {
        kind: 'fill',
        item: 'whats-your-name-usted',
        before: '¿Cómo ',
        answer: 'se',
        after: ' llama usted?',
        options: ['se', 'te', 'me'],
        why: {
          te: { en: 'Te goes with tú: ¿Cómo te llamas? With usted: ¿Cómo se llama usted?', 'zh-TW': 'te 搭配 tú：¿Cómo te llamas?。用 usted 時說 ¿Cómo se llama usted?。' },
          me: { en: 'Me is for yourself: me llamo… To ask usted: se llama.', 'zh-TW': 'me 是說自己：me llamo…。問 usted 要用 se llama。' },
        },
      },
      {
        kind: 'fill',
        item: 'mrs',
        before: '¡Buenos días, ',
        answer: 'señora',
        after: ' Bun!',
        options: ['señora', 'señor', 'tú'],
        why: {
          señor: { en: 'Señor is for a man. Mayor Bun is a woman: señora Bun.', 'zh-TW': 'señor 是稱呼男性。Mayor Bun 是女性，要說 señora Bun。' },
          tú: { en: 'Tú is not a title. Before a surname, say señor or señora.', 'zh-TW': 'tú 不是稱謂。姓氏前面要用 señor 或 señora。' },
        },
      },
      { kind: 'type', item: 'how-are-you-usted', context: { en: 'Ask Mayor Bun politely how she is.', 'zh-TW': '有禮貌地問 Mayor Bun 好不好。' } },
    ],
  },
};
