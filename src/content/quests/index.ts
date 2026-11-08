import type { QuestDefinition } from '../../npc/types';

/**
 * Every quest (PROGRESSION_SYSTEM §2). English UI text. Quests start by themselves when their
 * `requires` are met; the first main quest has none, so it is active from the very start.
 */
export const QUESTS: QuestDefinition[] = [
  {
    id: 'welcome-to-hello-town',
    kind: 'main',
    title: 'Welcome to Hello Town!',
    summary: "The Word Lanterns have gone dark. Meet the town, learn your first words and help light the Greetings lantern.",
    giverNpcId: 'mayor-bun',
    steps: [
      { id: 'meet', type: 'talk', targets: ['mayor-bun'], flag: 'met-mayor', npc: 'mayor-bun', description: 'Talk to the Town Mayor' },
      {
        id: 'explore',
        type: 'explore',
        targets: ['language-academy', 'burger-bistro', 'general-store'],
        description: 'Explore 3 Locations',
      },
      { id: 'academy', type: 'visit', targets: ['language-academy'], place: 'language-academy', description: 'Visit the Language Academy' },
      {
        id: 'lessons',
        type: 'learn',
        targets: ['greetings-1', 'greetings-2', 'greetings-3'],
        npc: 'maggie',
        description: "Finish Maggie's first Greetings lessons",
      },
      { id: 'chat', type: 'practice', targets: ['greetings'], npc: 'remy', description: 'Greet Remy by the fountain' },
      { id: 'report', type: 'talk', targets: ['mayor-bun'], npc: 'mayor-bun', turnIn: true, description: 'Report back to Mayor Bun' },
    ],
    rewards: {
      xp: 60,
      coins: 20,
      items: { 'hello-badge': 1 },
      unlocks: ['lantern:greetings', 'topping:lettuce', 'building:burger-bistro'],
    },
  },
  {
    // Spanish only: unit 2 of the Spanish syllabus (SPANISH_CURRICULUM §4, §8). Other languages have no
    // lessons 4–6 in Greetings yet, so the quest never starts for them.
    id: 'proper-introductions',
    kind: 'side',
    title: 'Proper Introductions',
    summary: 'Learn to introduce yourself, then try the polite usted on Mayor Bun.',
    giverNpcId: 'maggie',
    requires: { quests: ['welcome-to-hello-town'], languages: ['es'] },
    steps: [
      {
        id: 'lessons',
        type: 'learn',
        targets: ['greetings-4', 'greetings-5', 'greetings-6'],
        npc: 'maggie',
        description: "Finish Maggie's Introductions lessons",
      },
      { id: 'chat', type: 'practice', targets: ['greetings/usted'], npc: 'mayor-bun', description: 'Greet Mayor Bun politely (usted)' },
    ],
    rewards: { xp: 40, coins: 10 },
  },
  {
    id: 'a-taste-of-hello-town',
    kind: 'main',
    title: 'A Taste of Hello Town',
    summary: 'The Burger Bistro has opened its doors. Go and say hello!',
    giverNpcId: 'mayor-bun',
    requires: { quests: ['welcome-to-hello-town'] },
    steps: [
      { id: 'bistro', type: 'interact', targets: ['burger-bistro:door'], place: 'burger-bistro', description: 'Visit the Burger Bistro' },
    ],
    rewards: { xp: 20, coins: 5 },
  },
];

export const QUEST_BY_ID: Record<string, QuestDefinition> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
