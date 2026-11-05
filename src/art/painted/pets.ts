/**
 * Pets that follow NPCs around. 20×16 frames, facing right (left is mirrored).
 * Row 0: idle (tail wag, 2 frames). Row 1: walk (4 frames).
 */
import { PixelCanvas } from '../pixel';
import { palette, ramps } from '../tokens';

export const PET_FRAME = { w: 20, h: 16, cols: 4, rows: 2 } as const;

/** A small long-haired dog: cream coat, tan fluffy ears, curled tail. */
export function paintDogSheet(): HTMLCanvasElement {
  const { w, h, cols, rows } = PET_FRAME;
  const sheet = new PixelCanvas(w * cols, h * rows);
  for (let f = 0; f < 2; f++) sheet.blit(dog(f, -1), f * w, 0);
  for (let f = 0; f < 4; f++) sheet.blit(dog(f % 2, f), f * w, h);
  return sheet.toCanvas();
}

function dog(wag: number, step: number): PixelCanvas {
  const c = new PixelCanvas(PET_FRAME.w, PET_FRAME.h);
  const coat = ramps.wall;
  const ear = ramps.soil;
  const bob = step % 2 === 1 ? 1 : 0;
  // short legs
  const lift = (i: number) => (step >= 0 && (i + step) % 2 === 0 ? 1 : 0);
  [5, 7, 11, 13].forEach((x, i) => c.vline(x, 13 - lift(i), 14 - lift(i), coat[2]));
  // round fluffy body
  c.ellipseEach(9, 10 + bob, 5.5, 3.6, (x, y, nx, ny) => c.set(x, y, ny < -0.35 ? coat[0] : nx > 0.6 || ny > 0.6 ? coat[2] : coat[1]));
  for (const x of [4, 6, 9, 12]) c.set(x, 13 + bob, coat[1]); // fur fringe
  // plume tail
  const tx = wag ? 2 : 3;
  c.ellipseEach(tx + 1, 6 + bob, 1.8, 2.2, (x, y) => c.set(x, y, coat[0]));
  c.set(tx + 2, 8 + bob, coat[1]);
  // big round head
  c.ellipseEach(15, 7 + bob, 4, 3.6, (x, y, nx, ny) => c.set(x, y, nx > 0.55 || ny > 0.7 ? coat[2] : coat[1]));
  // fluffy ears, tilted outward
  c.rect(11, 3 + bob, 2, 2, ear[1]);
  c.set(10, 2 + bob, ear[0]);
  c.rect(17, 3 + bob, 2, 2, ear[1]);
  c.set(19, 2 + bob, ear[0]);
  c.set(11, 5 + bob, ear[2]);
  c.set(18, 5 + bob, ear[2]);
  // face
  c.rect(15, 6 + bob, 2, 2, palette.ink);
  c.set(15, 6 + bob, ramps.wall[0]);
  c.set(18, 8 + bob, palette.ink); // nose
  c.set(16, 9 + bob, ramps.blossom[1]); // tongue
  c.set(13, 8 + bob, ramps.blossom[0]); // cheek
  c.outline(palette.ink);
  return c;
}
