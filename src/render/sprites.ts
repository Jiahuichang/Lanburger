import * as THREE from 'three';
import { depth } from '../art/tokens';

/**
 * Coordinate convention: maps use pixels with y DOWN. Three.js uses y UP, so a map point (x, y)
 * renders at (x, -y). Anything that sorts by depth uses its foot line: lower on screen = in front.
 */
export const depthFor = (footY: number) => depth.actorBase + footY * depth.depthPerPixel;

/** Opaque pixel-art material: alpha-tested (crisp edges) and depth-sorted, so draw order never matters. */
export function cutoutMaterial(map: THREE.Texture): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ map, alphaTest: 0.5, transparent: false });
}

/** A quad of w×h art pixels whose anchor pixel sits on the mesh origin. */
export function anchoredQuad(w: number, h: number, ax: number, ay: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(w / 2 - ax, ay - h / 2, 0);
  return g;
}

/** A static sprite placed with its anchor on (x, footY) in map pixels. */
export function placeSprite(tex: THREE.Texture, w: number, h: number, anchor: { x: number; y: number }, x: number, footY: number, flip = false): THREE.Mesh {
  const mesh = new THREE.Mesh(anchoredQuad(w, h, anchor.x, anchor.y), cutoutMaterial(tex));
  if (flip) mesh.scale.x = -1;
  mesh.position.set(Math.round(x), -Math.round(footY), depthFor(footY));
  return mesh;
}
