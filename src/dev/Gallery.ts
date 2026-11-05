/**
 * Art gallery for reviews (`?gallery=1`). A dev page, not gameplay: it shows every painted sprite,
 * animation, topping and portrait at 4× so art can be judged without walking around the map.
 */
import { EXPRESSIONS, type LoadedCharacterSprite, type RowRef } from '../character/types';
import { loadHeroPortrait, loadHeroSprite, TOPPINGS, type BurgerStage } from '../character/hero';
import { loadNpcPortrait, loadNpcSprite } from '../character/npcs';
import { paintBuilding } from '../art/painted/buildings';
import { paintProp, paintLantern, paintBalloon } from '../art/painted/props';
import { paintTileAtlas } from '../art/painted/tiles';
import { PROP_KINDS, type BuildingStyle } from '../world/map/types';

const SCALE = 4;
const timers: (() => void)[] = [];

export async function showGallery(root: HTMLElement): Promise<void> {
  const page = el('div', 'gallery');
  root.append(page);
  page.append(el('h1', 'gallery-title', 'Lanburger — Art Gallery (R2)'));
  page.append(el('p', 'gallery-note', 'Painted at native resolution from the palette, shown at 4×. Animations loop at game speed.'));

  // Lanburger: growth stages × animations
  const hero = section(page, 'Lanburger — growth stages and animations');
  for (const stage of ['slider', 'classic', 'double', 'deluxe'] as BurgerStage[]) {
    const sprite = await loadHeroSprite(stage, []);
    const row = el('div', 'gallery-row');
    row.append(el('div', 'gallery-label', stage));
    for (const [state, facing] of [
      ['idle', 'down'], ['walk', 'down'], ['walk', 'right'], ['walk', 'up'], ['walk', 'left'],
      ['talk', 'down'], ['celebrate', 'down'], ['incorrect', 'down'], ['learn', 'down'],
    ] as const) {
      row.append(anim(sprite, state, facing, `${state} ${facing}`));
    }
    hero.append(row);
  }

  const tops = section(page, 'Toppings — earned by mastering topics (each one alone, then all together)');
  const trow = el('div', 'gallery-row');
  for (const t of TOPPINGS) trow.append(anim(await loadHeroSprite('classic', [t]), 'walk', 'down', t));
  trow.append(anim(await loadHeroSprite('classic', [...TOPPINGS]), 'walk', 'down', 'all five'));
  trow.append(anim(await loadHeroSprite('deluxe', [...TOPPINGS]), 'celebrate', 'down', 'deluxe + all'));
  tops.append(trow);

  // portraits
  const ports = section(page, 'Portraits — six expressions');
  for (const [name, p] of [
    ['Lanburger', await loadHeroPortrait()],
    ['Mayor Bun', await loadNpcPortrait('mayor-bun')],
    ['Jeremy', await loadNpcPortrait('jeremy')],
    ['Jonas', await loadNpcPortrait('jonas')],
    ['Summy', await loadNpcPortrait('summy')],
    ['Maggie', await loadNpcPortrait('maggie')],
  ] as const) {
    const row = el('div', 'gallery-row');
    row.append(el('div', 'gallery-label', name));
    for (const e of EXPRESSIONS) {
      const S = p.manifest.size;
      const cv = canvas(S, S, 3);
      cv.getContext('2d')!.drawImage(p.sheet, p.manifest.expressions[e] * S, 0, S, S, 0, 0, S, S);
      row.append(figure(cv, e, 'portrait'));
    }
    ports.append(row);
  }

  const npc = section(page, 'NPCs — Mayor Bun and the friend NPCs');
  for (const [key, name] of [['mayor-bun', 'Mayor Bun'], ['jeremy', 'Jeremy'], ['jonas', 'Jonas'], ['summy', 'Summy'], ['maggie', 'Maggie']] as const) {
    const sprite = await loadNpcSprite(key);
    const nrow = el('div', 'gallery-row');
    nrow.append(el('div', 'gallery-label', name));
    for (const f of ['down', 'right', 'up', 'left'] as const) nrow.append(anim(sprite, 'walk', f, `walk ${f}`));
    nrow.append(anim(sprite, 'idle', 'down', 'idle'));
    nrow.append(anim(sprite, 'talk', 'down', 'talk'));
    npc.append(nrow);
  }

  const town = section(page, 'Hello Town — buildings');
  const brow = el('div', 'gallery-row');
  const names: [BuildingStyle, string, number][] = [
    ['townHall', 'Town Hall', 14], ['academy', 'Language Academy', 12], ['bistro', 'Burger Bistro', 12],
    ['store', 'General Store', 12], ['garage', 'Racing Garage', 12], ['station', 'Travel Station', 12],
  ];
  for (const [style, name, w] of names) brow.append(figure(scaled(paintBuilding(style, w * 16, name, 3).canvas, 2), name));
  town.append(brow);

  const props = section(page, 'Props, lanterns and balloons');
  const prow = el('div', 'gallery-row');
  for (const k of PROP_KINDS) prow.append(figure(scaled(paintProp(k, 1).canvas, 2), k));
  prow.append(figure(scaled(paintLantern(false).canvas, 2), 'lantern (dark)'));
  prow.append(figure(scaled(paintLantern(true).canvas, 2), 'lantern (lit)'));
  for (const m of ['!', '?', '…'] as const) prow.append(figure(scaled(paintBalloon(m).canvas, 3), `balloon ${m}`));
  props.append(prow);

  const tiles = section(page, 'Ground tiles (rows: grass, path, plaza, water, bridge, forest, soil, stairs)');
  tiles.append(figure(scaled(paintTileAtlas(), 4), 'tile atlas'));
}

function anim(sprite: LoadedCharacterSprite, state: keyof LoadedCharacterSprite['manifest']['animations'], facing: 'down' | 'up' | 'left' | 'right', label: string): HTMLElement {
  const m = sprite.manifest;
  const clip = m.animations[state];
  const ref: RowRef = clip.rows[facing];
  const row = typeof ref === 'number' ? ref : ref.row;
  const flip = typeof ref !== 'number';
  const cv = canvas(m.frameWidth, m.frameHeight, SCALE);
  const ctx = cv.getContext('2d')!;
  let f = 0;
  const draw = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    if (flip) {
      ctx.translate(m.frameWidth, 0);
      ctx.scale(-1, 1);
    }
    for (const sheet of [sprite.sheet, ...(sprite.layers ?? [])]) {
      ctx.drawImage(sheet, f * m.frameWidth, row * m.frameHeight, m.frameWidth, m.frameHeight, 0, 0, m.frameWidth, m.frameHeight);
    }
    ctx.restore();
    f = (f + 1) % clip.frames;
  };
  draw();
  const id = window.setInterval(draw, 1000 / clip.fps);
  timers.push(() => clearInterval(id));
  return figure(cv, label);
}

function canvas(w: number, h: number, scale: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  cv.style.width = `${w * scale}px`;
  cv.style.height = `${h * scale}px`;
  return cv;
}

function scaled(src: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const cv = canvas(src.width, src.height, scale);
  cv.getContext('2d')!.drawImage(src, 0, 0);
  return cv;
}

function figure(cv: HTMLCanvasElement, label: string, cls = ''): HTMLElement {
  const f = el('figure', `gallery-figure ${cls}`);
  f.append(cv, el('figcaption', '', label));
  return f;
}

function section(page: HTMLElement, title: string): HTMLElement {
  const s = el('section', 'gallery-section');
  s.append(el('h2', '', title));
  page.append(s);
  return s;
}

function el(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
