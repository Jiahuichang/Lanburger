import type { MapSource, PropObject } from '../../world/map/types';

/**
 * Hello Town — the starting village (docs/WORLD_MAP.md §2). R1 greybox layout.
 * All coordinates are tiles (16 px). Objects sit on their foot point / front edge.
 *
 *                 [ Town Hall ]
 *  [ Language Academy ]  stairs   [ Burger Bistro ]
 *                    ( Town Square )
 *  [ General Store ]              [ Racing Garage ]
 *  ~~~~~~~~~~~~~~~~~~ stream ═bridge═ ~~~~~~~~~~~~~
 *                 [ Travel Station ]
 */

const trees: [number, number][] = [
  [23, 7], [28, 6], [25, 12], [30.5, 10.5], [57, 7], [52, 6], [55, 12], [49.5, 10.5],
  [24, 43], [56, 43], [29.5, 41], [50.5, 41], [5.5, 9], [74.5, 9], [21.5, 18], [58.5, 18],
  [30, 54], [50, 54], [20, 53.5], [60, 53.5], [10, 52.5], [70, 52.5], [6, 36], [74, 36],
];
const blossoms: [number, number][] = [
  [6, 23], [74, 23], [22.5, 29], [57.5, 29], [6, 43], [74, 43], [26, 50.5], [54, 50.5], [15, 55], [65, 55],
];
const bushes: [number, number][] = [
  [9.5, 18.6], [18.5, 18.6], [61.5, 18.6], [70.5, 18.6], [9.5, 38.6], [70.5, 38.6],
  [32, 15], [48, 15], [27, 37], [53, 37], [32, 56.5], [48, 56.5],
];
const lamps: [number, number][] = [
  [36.5, 17], [43.5, 17], [27, 21], [53, 21], [27, 31.2], [53, 31.2], [37.5, 43], [42.5, 43],
];

const props = (kind: PropObject['kind'], list: [number, number][], seed = 1): PropObject[] =>
  list.map(([x, y], i) => ({ type: 'prop', kind, x, y, seed: seed * 100 + i, flip: i % 2 === 1 }));

export const helloTown: MapSource = {
  id: 'hello-town',
  name: 'Hello Town',
  width: 80,
  height: 60,
  base: 'grass',
  defaultSpawn: 'start',
  ground: [
    // forest frame
    { op: 'rect', kind: 'forest', x: 0, y: 0, w: 80, h: 4 },
    { op: 'rect', kind: 'forest', x: 0, y: 0, w: 3, h: 60 },
    { op: 'rect', kind: 'forest', x: 77, y: 0, w: 3, h: 60 },
    { op: 'rect', kind: 'forest', x: 0, y: 58, w: 80, h: 2 },
    { op: 'ellipse', kind: 'forest', cx: 9, cy: 4, rx: 7, ry: 3 },
    { op: 'ellipse', kind: 'forest', cx: 71, cy: 4, rx: 7, ry: 3 },
    { op: 'ellipse', kind: 'forest', cx: 3, cy: 29, rx: 3, ry: 6 },
    { op: 'ellipse', kind: 'forest', cx: 77, cy: 29, rx: 3, ry: 6 },
    { op: 'ellipse', kind: 'forest', cx: 4, cy: 56, rx: 6, ry: 3 },
    { op: 'ellipse', kind: 'forest', cx: 76, cy: 56, rx: 6, ry: 3 },
    // stream and bridge
    { op: 'path', kind: 'water', points: [[0, 46], [18, 47.5], [38, 46.5], [58, 47.5], [80, 46]], width: 3 },
    // paths
    { op: 'path', kind: 'path', points: [[14, 18], [14, 21.5], [29, 25]], width: 3 },
    { op: 'path', kind: 'path', points: [[66, 18], [66, 21.5], [51, 25]], width: 3 },
    { op: 'path', kind: 'path', points: [[14, 38], [20, 39], [31, 32]], width: 3 },
    { op: 'path', kind: 'path', points: [[66, 38], [60, 39], [49, 32]], width: 3 },
    { op: 'path', kind: 'path', points: [[40, 15], [40, 20]], width: 4 },
    { op: 'path', kind: 'path', points: [[40, 34], [40, 44.5]], width: 4 },
    { op: 'path', kind: 'path', points: [[40, 49.5], [40, 56.5]], width: 4 },
    { op: 'rect', kind: 'bridge', x: 38, y: 44, w: 4, h: 6 },
    { op: 'rect', kind: 'stairs', x: 38, y: 13, w: 4, h: 3 },
    // town square
    { op: 'ellipse', kind: 'plaza', cx: 40, cy: 27.5, rx: 11.5, ry: 8.5 },
  ],
  objects: [
    { type: 'spawn', id: 'start', x: 40, y: 39, facing: 'up' },

    {
      type: 'building', id: 'town-hall', style: 'townHall', name: 'Town Hall', x: 33, y: 13, w: 14, depth: 4,
      blurb: "Mayor Bun's office — the heart of Hello Town. The mayor will see you soon.",
    },
    {
      type: 'building', id: 'language-academy', style: 'academy', name: 'Language Academy', x: 8, y: 17, w: 12, depth: 4,
      blurb: 'Greetings & introductions. Maggie is preparing the first class.',
    },
    {
      type: 'building', id: 'burger-bistro', style: 'bistro', name: 'Burger Bistro', x: 60, y: 17, w: 12, depth: 4,
      blurb: 'Food & ordering. Closed for prep — visit the Language Academy first!',
    },
    {
      type: 'building', id: 'general-store', style: 'store', name: 'General Store', x: 8, y: 37, w: 12, depth: 4,
      blurb: 'Shopping, prices & quantities. Opening soon.',
    },
    {
      type: 'building', id: 'racing-garage', style: 'garage', name: 'Racing Garage', x: 60, y: 37, w: 12, depth: 4,
      blurb: 'Transport & directions. Rusty is still tuning the karts.',
    },
    {
      type: 'building', id: 'travel-station', style: 'station', name: 'Travel Station', x: 34, y: 57, w: 12, depth: 3,
      blurb: 'The trains stopped when the Word Lanterns went dark. Light all five to travel again.',
    },

    { type: 'prop', kind: 'fountain', x: 40, y: 29.5 },
    { type: 'lantern', id: 'lantern-greetings', topic: 'greetings', topicName: 'Greetings', x: 31.5, y: 26 },
    { type: 'lantern', id: 'lantern-food', topic: 'food', topicName: 'Food & Ordering', x: 35, y: 21.5 },
    { type: 'lantern', id: 'lantern-shopping', topic: 'shopping', topicName: 'Shopping', x: 45, y: 21.5 },
    { type: 'lantern', id: 'lantern-directions', topic: 'directions', topicName: 'Directions', x: 48.5, y: 26 },
    { type: 'lantern', id: 'lantern-everyday', topic: 'everyday', topicName: 'Everyday Talk', x: 40, y: 34.5 },

    {
      type: 'sign', id: 'welcome-sign', x: 36.5, y: 38,
      title: 'Welcome to Hello Town!',
      body: 'Every building here teaches something new. Explore, meet the townsfolk, and help light the Word Lanterns.',
    },
    {
      type: 'sign', id: 'bridge-sign', x: 43.5, y: 51,
      title: 'Travel Station',
      body: 'Trains to other villages. Service resumes when all five Word Lanterns shine.',
    },

    ...props('tree', trees, 1),
    ...props('blossomTree', blossoms, 2),
    ...props('bush', bushes, 3),
    ...props('lamp', lamps, 4),
    ...props('banner', [[35, 15.5], [45, 15.5]], 5),
    ...props('bench', [[33.5, 32], [46.5, 32]], 6),
    ...props('flowerBed', [[10.5, 21.5], [17.5, 20.2], [62.5, 20.2], [69.5, 21.5]], 7),
    ...props('flowers', [[24, 24], [56, 24], [24, 31], [56, 31], [33, 36.5], [47, 36.5], [12, 44], [68, 44], [32, 49.5], [48, 49.5]], 8),
    ...props('crate', [[9.5, 40], [11, 40.5], [62, 41.3]], 9),
    ...props('barrel', [[18.5, 41.2], [70, 40], [71.2, 40.6]], 10),
    ...props('rock', [[15, 44.5], [65, 44.5], [33, 44.2], [47, 44.2]], 11),
  ],
};
