import * as THREE from 'three';
import type { Painted } from '../assets/proceduralArt';

export interface SpriteOptions {
  additive?: boolean;
  opacity?: number;
  color?: string;
  /** 'bottom' = origin at bottom-center (props), 'center' = centered (fx). */
  anchor?: 'bottom' | 'center';
}

/** A flat textured quad. All world art is drawn with these. */
export function spriteMesh(p: Painted, o: SpriteOptions = {}): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(p.w, p.h);
  if ((o.anchor ?? 'bottom') === 'bottom') geo.translate(0, p.h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: p.tex,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    opacity: o.opacity ?? 1,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  if (o.color) mat.color.set(o.color);
  return new THREE.Mesh(geo, mat);
}

/** A flat colored quad (used for fillers under parallax bands). */
export function colorQuad(w: number, h: number, color: string): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, -h / 2, 0); // origin at top-center
  // transparent so it is sorted with the painted layers instead of the opaque pass
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, depthWrite: false, transparent: true }));
}
