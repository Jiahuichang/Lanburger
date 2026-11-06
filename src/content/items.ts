/**
 * Items and toppings (PROGRESSION_SYSTEM §5.2, §8). English UI names. Icons come from src/ui/icons.ts.
 */
export interface ItemDef {
  id: string;
  name: string;
  kind: 'quest' | 'keepsake' | 'cosmetic';
  description: string;
  icon: 'badge' | 'coin' | 'leaf';
}

export const ITEMS: Record<string, ItemDef> = {
  'hello-badge': {
    id: 'hello-badge',
    name: 'Hello Town Badge',
    kind: 'keepsake',
    description: 'Mayor Bun gave you this for lighting the first Word Lantern.',
    icon: 'badge',
  },
};

/** Toppings Lanburger can earn, in stacking order, and the topic that unlocks each. */
export const TOPPING_INFO: Record<string, { name: string; topic: string }> = {
  lettuce: { name: 'Lettuce', topic: 'greetings' },
  cheese: { name: 'Cheese', topic: 'food' },
  tomato: { name: 'Tomato', topic: 'shopping' },
  pickle: { name: 'Pickle', topic: 'directions' },
  onion: { name: 'Onion', topic: 'everyday' },
};
