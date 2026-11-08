import type { Topic } from '../../../learning/content';

/**
 * Spanish Greetings: syllabus units 1 (Saludos) and 2 (Presentarse), SPANISH_CURRICULUM §4 and §8 (R6B).
 * Latin American Spanish with Mexican vocabulary, tú with townsfolk and usted with Mayor Bun (§7).
 * Lesson ids greetings-1…3 are unit 1, so the first main quest asks for the same lessons in every language.
 * Every sentence is original. 👩‍🏫 Needs review by a Spanish teacher (pack `reviewed: false`).
 */
export const greetingsEs: Topic = {
  id: 'greetings',
  name: 'Greetings',
  items: [
    // unit 1 · lesson 1
    {
      id: 'hello',
      meaning: { en: 'Hello! / Hi!', 'zh-TW': '你好！（打招呼）' },
      tags: { act: 'greet' },
      note: { en: 'The h is silent: Hola sounds like “ola”.', 'zh-TW': 'h 不發音：Hola 唸起來像「ola」。' },
    },
    { id: 'goodbye', meaning: { en: 'Goodbye!', 'zh-TW': '再見！' }, tags: { act: 'farewell' } },
    {
      id: 'see-you-later',
      meaning: { en: 'See you later!', 'zh-TW': '待會見！／回頭見！' },
      tags: { act: 'farewell' },
      note: {
        en: 'Very common, even when you are not sure you will see them later.',
        'zh-TW': '非常常用，就算不確定待會會不會再見面也可以說。',
      },
    },
    { id: 'see-you-tomorrow', meaning: { en: 'See you tomorrow!', 'zh-TW': '明天見！' }, tags: { act: 'farewell' } },
    { id: 'thank-you', meaning: { en: 'Thank you!', 'zh-TW': '謝謝！' }, tags: { act: 'thanks' } },
    // unit 1 · lesson 2
    {
      id: 'good-morning',
      meaning: { en: 'Good morning!', 'zh-TW': '早安！（上午）' },
      tags: { act: 'greet', time: 'morning' },
      note: { en: 'Until about noon. Días is masculine, so: buenos.', 'zh-TW': '大約用到中午。días 是陽性，所以用 buenos。' },
    },
    {
      id: 'good-afternoon',
      meaning: { en: 'Good afternoon!', 'zh-TW': '午安！（下午）' },
      tags: { act: 'greet', time: 'afternoon' },
      note: { en: 'From noon until it gets dark. Tardes is feminine, so: buenas.', 'zh-TW': '從中午到天黑前。tardes 是陰性，所以用 buenas。' },
    },
    {
      id: 'good-night',
      meaning: { en: 'Good evening! / Good night!', 'zh-TW': '晚安！（晚上）' },
      tags: { time: 'night' },
      note: { en: 'After dark, both to say hello and to say goodbye.', 'zh-TW': '天黑以後用，見面打招呼和道別都可以。' },
    },
    // unit 1 · lesson 3
    {
      id: 'how-is-it-going',
      meaning: { en: 'How’s it going?', 'zh-TW': '還好嗎？／最近怎麼樣？' },
      tags: { act: 'ask-how' },
      note: { en: 'Works with everyone, friends or not.', 'zh-TW': '對誰都可以說，熟不熟都行。' },
    },
    {
      id: 'how-are-you',
      meaning: { en: 'How are you? (to a friend)', 'zh-TW': '你好嗎？（對朋友）' },
      tags: { act: 'ask-how', register: 'tu' },
      note: { en: 'Estás is the tú form: for friends.', 'zh-TW': 'estás 是 tú 的形式，對朋友用。' },
    },
    { id: 'im-fine', meaning: { en: 'Fine, thanks.', 'zh-TW': '很好，謝謝。' }, tags: { act: 'answer-how' } },
    {
      id: 'and-you',
      meaning: { en: 'And you? (to a friend)', 'zh-TW': '那你呢？（對朋友）' },
      tags: { act: 'ask-back', register: 'tu' },
      note: { en: 'Always ask back! Tú is for friends.', 'zh-TW': '記得反問對方！tú 是對朋友用的「你」。' },
    },
    // unit 2 · lesson 4
    {
      id: 'whats-your-name',
      meaning: { en: 'What’s your name? (to a friend)', 'zh-TW': '你叫什麼名字？（對朋友）' },
      tags: { act: 'ask-name', register: 'tu' },
    },
    {
      id: 'my-name-is',
      meaning: { en: 'My name is {name}.', 'zh-TW': '我叫 {name}。' },
      tags: { act: 'give-name' },
      note: { en: 'Literally: “I call myself {name}”.', 'zh-TW': '字面意思是「我稱呼自己為 {name}」。' },
    },
    {
      id: 'i-am',
      meaning: { en: 'I’m {name}.', 'zh-TW': '我是 {name}。' },
      tags: { act: 'give-name' },
      note: { en: 'Shorter, and just as friendly.', 'zh-TW': '比較短，一樣親切。' },
    },
    // unit 2 · lesson 5
    {
      id: 'nice-to-meet-you',
      meaning: { en: 'Nice to meet you.', 'zh-TW': '很高興認識你。' },
      tags: { act: 'meet' },
      note: { en: 'The same words for everyone who says it.', 'zh-TW': '不管誰說，說法都一樣。' },
    },
    {
      id: 'pleased',
      meaning: { en: 'Pleased to meet you.', 'zh-TW': '幸會。／很高興認識你。' },
      tags: { act: 'meet' },
      note: {
        en: 'It changes with the speaker: encantado (-o) or encantada (-a).',
        'zh-TW': '會依說話的人改變：encantado（-o）或 encantada（-a）。',
      },
    },
    { id: 'likewise', meaning: { en: 'Likewise. / Same here.', 'zh-TW': '我也是。／彼此彼此。' }, tags: { act: 'meet' } },
    // unit 2 · lesson 6
    {
      id: 'mr',
      meaning: { en: 'Mr. / sir', 'zh-TW': '先生' },
      tags: { act: 'title' },
      note: { en: 'Señor + surname: señor López.', 'zh-TW': 'señor 加上姓氏：señor López。' },
    },
    {
      id: 'mrs',
      meaning: { en: 'Mrs. / ma’am', 'zh-TW': '女士／太太' },
      tags: { act: 'title' },
      note: { en: 'Señora + surname: señora Bun.', 'zh-TW': 'señora 加上姓氏：señora Bun。' },
    },
    {
      id: 'whats-your-name-usted',
      meaning: { en: 'What’s your name? (polite)', 'zh-TW': '請問您叫什麼名字？（禮貌，用 usted）' },
      tags: { act: 'ask-name', register: 'usted' },
      note: { en: 'With usted the verb changes: te llamas → se llama.', 'zh-TW': '用 usted 時動詞會變：te llamas → se llama。' },
    },
    {
      id: 'how-are-you-usted',
      meaning: { en: 'How are you? (polite)', 'zh-TW': '您好嗎？（禮貌，用 usted）' },
      tags: { act: 'ask-how', register: 'usted' },
      note: { en: 'estás → está.', 'zh-TW': 'estás → está。' },
    },
    {
      id: 'and-you-usted',
      meaning: { en: 'And you? (polite)', 'zh-TW': '那您呢？（禮貌）' },
      tags: { act: 'ask-back', register: 'usted' },
      note: { en: '¿Y tú? → ¿Y usted?', 'zh-TW': '¿Y tú? → ¿Y usted?' },
    },
  ],
  units: [
    {
      id: 'es-1',
      number: 1,
      title: 'Saludos',
      canDo: {
        en: 'Greet people at any time of day, ask how they are, and say goodbye.',
        'zh-TW': '能依時段打招呼、問候對方近況，並且道別。',
      },
      lessons: ['greetings-1', 'greetings-2', 'greetings-3'],
      practice: 'greetings',
    },
    {
      id: 'es-2',
      number: 2,
      title: 'Presentarse',
      canDo: {
        en: 'Introduce yourself, ask someone’s name, and talk politely with usted.',
        'zh-TW': '能介紹自己、問別人的名字，並用 usted 有禮貌地交談。',
      },
      lessons: ['greetings-4', 'greetings-5', 'greetings-6'],
      practice: 'greetings/usted',
    },
  ],
  chats: {
    greetings: { lessons: ['greetings-1', 'greetings-2', 'greetings-3'], size: 4 },
    usted: { lessons: ['greetings-4', 'greetings-5', 'greetings-6'], register: 'usted', size: 5 },
  },
  lessons: [
    {
      id: 'greetings-1',
      title: 'Hello & Goodbye',
      items: ['hello', 'goodbye', 'see-you-later', 'see-you-tomorrow', 'thank-you'],
      explain: {
        en: 'In Hello Town everyone says hello when they meet and goodbye when they leave. Let’s start with the friendliest words!',
        'zh-TW': '在 Hello Town，大家見面會打招呼，離開時會道別。我們從最友善的幾句話開始吧！',
      },
      goal: { en: 'Say hello, goodbye and thank you.', 'zh-TW': '會打招呼、道別和道謝。' },
      rule: {
        en: 'Meeting: ¡Hola! Leaving: ¡Adiós! If you will see them again: ¡Hasta luego! or ¡Hasta mañana!',
        'zh-TW': '見面說 ¡Hola!；離開說 ¡Adiós!。如果之後還會見面，可以說 ¡Hasta luego! 或 ¡Hasta mañana!。',
      },
      pairs: [
        { line: 'hello', reply: 'hello', wrong: ['goodbye', 'see-you-tomorrow'] },
        {
          line: 'goodbye',
          reply: ['goodbye', 'see-you-later', 'see-you-tomorrow'],
          wrong: ['hello', 'thank-you'],
          context: { en: 'It’s time to go home.', 'zh-TW': '該回家了。' },
          both: true,
        },
      ],
    },
    {
      id: 'greetings-2',
      title: 'Morning to Night',
      items: ['good-morning', 'good-afternoon', 'good-night'],
      explain: {
        en: 'Spanish greetings change with the time of day, just like the light in Hello Town.',
        'zh-TW': '西班牙文的招呼語會隨著時段改變，就像 Hello Town 的光線一樣。',
      },
      goal: { en: 'Greet people in the morning, the afternoon and the evening.', 'zh-TW': '會在早上、下午和晚上打招呼。' },
      rule: {
        en: 'Before noon: buenos días. From noon until dark: buenas tardes. After dark: buenas noches. Días is masculine (buenos); tardes and noches are feminine (buenas).',
        'zh-TW': '中午以前：buenos días。中午到天黑：buenas tardes。天黑以後：buenas noches。días 是陽性（buenos），tardes 和 noches 是陰性（buenas）。',
      },
      pairs: [
        {
          line: 'good-morning',
          reply: ['good-morning', 'hello'],
          wrong: ['good-afternoon', 'good-night'],
          context: { en: '8 a.m. at the fountain.', 'zh-TW': '早上 8 點，在噴水池旁。' },
          time: 'morning',
        },
        {
          reply: ['good-afternoon', 'hello'],
          wrong: ['good-morning', 'good-night'],
          context: { en: '4 p.m. You walk up to the fountain.', 'zh-TW': '下午 4 點，你走到噴水池旁。' },
          time: 'afternoon',
        },
        {
          line: 'good-night',
          reply: ['good-night', 'see-you-tomorrow', 'goodbye'],
          wrong: ['good-morning', 'good-afternoon'],
          context: { en: '9 p.m. Everyone is going home.', 'zh-TW': '晚上 9 點，大家要回家了。' },
          time: 'night',
          both: true,
        },
      ],
    },
    {
      id: 'greetings-3',
      title: 'How’s It Going?',
      items: ['how-is-it-going', 'how-are-you', 'im-fine', 'and-you'],
      explain: {
        en: 'After hello, friends ask how you are. Answer, then ask back!',
        'zh-TW': '打完招呼，朋友常會問你好不好。回答之後，記得反問對方！',
      },
      goal: { en: 'Ask how someone is, answer, and ask back.', 'zh-TW': '會問候對方、回答，並且反問。' },
      rule: {
        en: '¿Qué tal? works with everyone. ¿Cómo estás? and ¿Y tú? use tú: they are for friends.',
        'zh-TW': '¿Qué tal? 對誰都能用。¿Cómo estás? 和 ¿Y tú? 用的是 tú，是對朋友的說法。',
      },
      pairs: [
        { line: 'how-is-it-going', reply: 'im-fine', wrong: ['see-you-later', 'good-morning'] },
        { line: 'how-are-you', reply: 'im-fine', wrong: ['hello', 'see-you-tomorrow'] },
        { line: 'im-fine', reply: 'and-you', wrong: ['see-you-tomorrow', 'thank-you'], register: 'tu' },
      ],
    },
    {
      id: 'greetings-4',
      title: 'What’s Your Name?',
      items: ['whats-your-name', 'my-name-is', 'i-am'],
      explain: {
        en: 'Time to introduce yourself! Ask someone’s name and tell them yours.',
        'zh-TW': '來自我介紹吧！問對方的名字，也說出你自己的名字。',
      },
      goal: { en: 'Ask someone’s name and say yours.', 'zh-TW': '會問別人的名字，也會說自己的名字。' },
      rule: {
        en: 'Two ways to say your name: Me llamo {name}. or Soy {name}. Both are right!',
        'zh-TW': '說自己的名字有兩種說法：Me llamo {name}. 或 Soy {name}.，兩種都對！',
      },
      pairs: [
        { line: 'whats-your-name', reply: ['my-name-is', 'i-am'], wrong: ['and-you', 'see-you-later'], both: true },
        { line: 'my-name-is', reply: ['my-name-is', 'i-am'], wrong: ['good-night', 'see-you-later'] },
      ],
    },
    {
      id: 'greetings-5',
      title: 'Nice to Meet You',
      items: ['nice-to-meet-you', 'pleased', 'likewise'],
      explain: {
        en: 'When you meet someone new, tell them you’re pleased to meet them.',
        'zh-TW': '認識新朋友時，告訴對方很高興認識他。',
      },
      goal: { en: 'Say you’re pleased to meet someone, and answer when they say it.', 'zh-TW': '會說「很高興認識你」，也會回應。' },
      rule: {
        en: 'Mucho gusto is the same for everyone. Encantado / encantada changes with the speaker. The answer to both: Igualmente.',
        'zh-TW': 'Mucho gusto 誰說都一樣；encantado／encantada 會依說話的人改變。兩句都可以用 Igualmente 回應。',
      },
      pairs: [
        { line: 'i-am', reply: ['nice-to-meet-you', 'pleased'], wrong: ['see-you-tomorrow', 'thank-you'], both: true },
        { line: 'nice-to-meet-you', reply: ['likewise', 'nice-to-meet-you', 'pleased'], wrong: ['hello', 'see-you-later'] },
      ],
    },
    {
      id: 'greetings-6',
      title: 'Polite “You” (usted)',
      items: ['mr', 'mrs', 'whats-your-name-usted', 'how-are-you-usted', 'and-you-usted'],
      explain: {
        en: 'With people you don’t know well, or someone important like Mayor Bun, Spanish uses usted, the polite “you”.',
        'zh-TW': '對不熟的人，或像 Mayor Bun 這樣重要的人，西班牙文用 usted，也就是禮貌的「您」。',
      },
      goal: { en: 'Talk politely with usted.', 'zh-TW': '會用 usted 有禮貌地交談。' },
      rule: {
        en: 'tú → usted: ¿Cómo te llamas? → ¿Cómo se llama usted? · ¿Cómo estás? → ¿Cómo está usted? · ¿Y tú? → ¿Y usted?',
        'zh-TW': 'tú → usted：¿Cómo te llamas? → ¿Cómo se llama usted?；¿Cómo estás? → ¿Cómo está usted?；¿Y tú? → ¿Y usted?',
      },
      pairs: [
        { line: 'whats-your-name-usted', reply: ['my-name-is', 'i-am'], wrong: ['and-you-usted', 'good-night'], register: 'usted' },
        { line: 'how-are-you-usted', reply: 'im-fine', wrong: ['see-you-later', 'i-am'], register: 'usted' },
        { line: 'im-fine', reply: 'and-you-usted', wrong: ['and-you', 'see-you-tomorrow'], register: 'usted' },
        {
          reply: 'how-are-you-usted',
          wrong: ['how-are-you', 'whats-your-name'],
          context: { en: 'Morning at Town Hall. Ask Mayor Bun politely how she is.', 'zh-TW': '早上在鎮公所。有禮貌地問 Mayor Bun 好不好。' },
          register: 'usted',
        },
      ],
    },
  ],
};
