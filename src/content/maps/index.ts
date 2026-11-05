import type { MapSource } from '../../world/map/types';
import { helloTown } from './hello-town';
import { languageAcademy } from './language-academy';

/** Every map in the game, by id. Scenes look maps up here; they never import a map directly. */
export const MAPS: Record<string, MapSource> = {
  [helloTown.id]: helloTown,
  [languageAcademy.id]: languageAcademy,
};
