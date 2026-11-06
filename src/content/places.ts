import { MAPS } from './maps';
import { TOPICS } from './learning';
import type { BuildingObject, LanternObject } from '../world/map/types';

/** Names looked up from content data, so systems never hard-code village names. */

export function buildingDef(id: string): (BuildingObject & { mapId: string }) | undefined {
  for (const m of Object.values(MAPS)) {
    const b = m.objects.find((o): o is BuildingObject => o.type === 'building' && o.id === id);
    if (b) return { ...b, mapId: m.id };
  }
  return undefined;
}

/** A building's or a map's English name. */
export function placeName(id: string): string {
  return buildingDef(id)?.name ?? MAPS[id]?.name ?? id;
}

/** Every Word Lantern on a map, in map order. */
export function lanternsOn(mapId: string): LanternObject[] {
  return (MAPS[mapId]?.objects ?? []).filter((o): o is LanternObject => o.type === 'lantern');
}

/** English topic name (from the topic, or from a lantern that names it). */
export function topicName(id: string): string {
  if (TOPICS[id]) return TOPICS[id].name;
  for (const m of Object.values(MAPS)) {
    const l = m.objects.find((o): o is LanternObject => o.type === 'lantern' && o.topic === id);
    if (l) return l.topicName;
  }
  return id;
}
