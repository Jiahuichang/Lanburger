import type { Topic } from '../../../learning/content';

/** Greetings — the Language Academy's topic (WORLD_MAP §2.2, LEARNING_SYSTEM §8). */
export const greetings: Topic = {
  id: 'greetings',
  name: 'Greetings',
  items: [
    { id: 'hello', meaning: { en: 'Hello!', 'zh-TW': '你好！（打招呼）' } },
    { id: 'good-morning', meaning: { en: 'Good morning!', 'zh-TW': '早安！' } },
    { id: 'goodbye', meaning: { en: 'Goodbye!', 'zh-TW': '再見！' } },
    { id: 'thank-you', meaning: { en: 'Thank you!', 'zh-TW': '謝謝！' } },
    { id: 'my-name-is', meaning: { en: 'My name is Lanburger.', 'zh-TW': '我叫 Lanburger。' } },
    { id: 'whats-your-name', meaning: { en: "What's your name?", 'zh-TW': '你叫什麼名字？' } },
    { id: 'nice-to-meet-you', meaning: { en: 'Nice to meet you.', 'zh-TW': '很高興認識你。' } },
    { id: 'how-are-you', meaning: { en: 'How are you?', 'zh-TW': '你好嗎？' } },
    { id: 'im-fine', meaning: { en: "I'm fine, thanks.", 'zh-TW': '我很好，謝謝。' } },
  ],
  lessons: [
    {
      id: 'greetings-1',
      title: 'Hello & Goodbye',
      items: ['hello', 'good-morning', 'goodbye', 'thank-you'],
      explain: {
        en: "The first words in any language are the friendly ones: hello, good morning, goodbye and thank you. You'll use them every day in Hello Town!",
        'zh-TW': '每種語言最先學的，都是最友善的話：你好、早安、再見、謝謝。在 Hello Town 每天都用得到！',
      },
      pairs: [
        { line: 'hello', reply: 'hello', wrong: ['goodbye', 'thank-you'] },
        { line: 'goodbye', reply: 'goodbye', wrong: ['good-morning', 'hello'] },
      ],
    },
    {
      id: 'greetings-2',
      title: 'Introductions',
      items: ['my-name-is', 'whats-your-name', 'nice-to-meet-you'],
      explain: {
        en: 'When you meet someone new: ask their name, tell them yours, and say it is nice to meet them.',
        'zh-TW': '認識新朋友時：問對方的名字、說出自己的名字，再說很高興認識你。',
      },
      pairs: [
        { line: 'whats-your-name', reply: 'my-name-is', wrong: ['goodbye', 'thank-you', 'nice-to-meet-you'] },
        { line: 'my-name-is', reply: 'nice-to-meet-you', wrong: ['goodbye', 'whats-your-name'] },
      ],
    },
    {
      id: 'greetings-3',
      title: 'How are you?',
      items: ['how-are-you', 'im-fine'],
      explain: {
        en: 'Friends often ask how you are. A short, friendly answer is perfect.',
        'zh-TW': '朋友見面常會問「你好嗎？」，簡短又友善地回答就很好了。',
      },
      pairs: [
        { line: 'how-are-you', reply: 'im-fine', wrong: ['goodbye', 'whats-your-name', 'my-name-is'] },
      ],
    },
  ],
};
