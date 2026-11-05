import type { MapSource, PropObject } from '../../world/map/types';

/**
 * Language Academy — interior (WORLD_MAP §2.2). Maggie's classroom, where the Greetings lessons happen (R4).
 * 20×14 tiles: a back wall with a blackboard and windows, desks either side of a rug aisle, a door at the bottom.
 */
const desks: [number, number][] = [
  [3.6, 8], [6.4, 8], [13.6, 8], [16.4, 8],
  [3.6, 11], [6.4, 11], [13.6, 11], [16.4, 11],
];

export const languageAcademy: MapSource = {
  id: 'language-academy',
  name: 'Language Academy',
  width: 20,
  height: 14,
  base: 'void',
  indoor: true,
  defaultSpawn: 'entrance',
  ground: [
    { op: 'rect', kind: 'wall', x: 1, y: 0, w: 18, h: 3 },
    { op: 'rect', kind: 'floor', x: 1, y: 3, w: 18, h: 10 },
    { op: 'rect', kind: 'floor', x: 9, y: 13, w: 2, h: 1 },
    { op: 'rect', kind: 'rug', x: 8, y: 6, w: 4, h: 7 },
  ],
  objects: [
    { type: 'spawn', id: 'entrance', x: 10, y: 12.6, facing: 'up' },
    { type: 'warp', id: 'exit', x: 9, y: 13.3, w: 2, h: 0.7, to: 'hello-town', spawn: 'academy-door', facing: 'down' },

    { type: 'prop', kind: 'blackboard', x: 10, y: 3 },
    { type: 'prop', kind: 'wallWindow', x: 4.5, y: 2.9 },
    { type: 'prop', kind: 'wallWindow', x: 15.5, y: 2.9 },
    // the Practice Corner: free practice that restores energy (PROGRESSION_SYSTEM §3)
    { type: 'activity', id: 'practice-corner', activity: 'practice', title: 'Practice Corner', prop: 'bookshelf', x: 2.4, y: 4.0 },
    { type: 'prop', kind: 'bookshelf', x: 17.6, y: 4.0, seed: 2 },
    { type: 'prop', kind: 'desk', x: 14.6, y: 5.4 },
    { type: 'prop', kind: 'plant', x: 1.8, y: 12.8 },
    { type: 'prop', kind: 'plant', x: 18.2, y: 12.8 },
    ...desks.map(([x, y]): PropObject => ({ type: 'prop', kind: 'desk', x, y })),
  ],
};
