import * as THREE from 'three';
import type { Scene, SceneContext, ReturnPoint } from '../core/Scene';
import type { Services } from '../core/Services';
import { depth, palette } from '../art/tokens';
import { ANIM_STATES, facingFromVector, facingVector } from '../character/types';
import { loadHeroSprite } from '../character/hero';
import { MAPS } from '../content/maps';
import { t } from '../i18n';
import { START_MAP } from '../save/schema';
import { ActorView } from '../render/ActorView';
import { LightLayer } from '../render/LightLayer';
import { TileMapView } from '../render/TileMapView';
import { TileMap, type Interactable } from './map/TileMap';
import { MOVE, TopDownMover } from './TopDownMover';

const EMOTE_SECONDS = { celebrate: 0.6, incorrect: 0.9, talk: 0.8, learn: 1.2 } as const;

/** Top-down village scene (IMPLEMENTATION_PLAN §4): loads a map by id and lets the player explore it. */
export class WorldScene implements Scene {
  readonly id = 'world';
  private s!: Services;
  private map!: TileMap;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  private mapView!: TileMapView;
  private lights!: LightLayer;
  private player!: TopDownMover;
  private view!: ActorView;
  private cam = { x: 0, y: 0 };
  private nearby: Interactable | null = null;
  private bubbleFor: Interactable | null = null;
  private saveTimer = 0;
  private debugPlayer?: THREE.LineSegments;
  private unsub: (() => void)[] = [];

  async enter(ctx: SceneContext): Promise<void> {
    this.s = ctx.services;
    const save = this.s.save.data;
    const rp = ctx.params?.returnPoint as ReturnPoint | undefined;
    const mapId = rp?.mapId ?? save.location.mapId;
    this.map = new TileMap(MAPS[mapId] ?? MAPS[START_MAP]);

    this.mapView = new TileMapView(this.map);
    this.scene.add(this.mapView.object);
    this.lights = new LightLayer(this.map.lights, { w: this.map.widthPx, h: this.map.heightPx }, save.settings.reducedMotion);
    this.scene.add(this.lights.object);
    for (const id of save.lanterns) this.setLantern(`lantern-${id}`, true);

    const saved = save.location.mapId === this.map.id && Number.isFinite(save.location.x) ? save.location : null;
    const start = rp ?? saved ?? this.map.spawn();
    this.player = new TopDownMover(start.x, start.y, start.facing);
    if (this.map.collides(start.x - MOVE.bodyW / 2, start.y - MOVE.bodyH, MOVE.bodyW, MOVE.bodyH)) {
      const sp = this.map.spawn();
      this.player.place(sp.x, sp.y, sp.facing);
    }

    const hero = await loadHeroSprite();
    this.view = new ActorView(hero);
    this.scene.add(this.view.object);
    this.s.ui.hud.setPortrait(hero.sheet, hero.manifest.frameWidth);
    this.s.ui.hud.setLocation(this.map.name);

    this.cam = { x: this.player.x, y: this.player.y - 16 };
    if (this.s.flags.debug) this.buildDebug();
    this.s.pixel.fitCamera(this.camera);
    this.s.pixel.compile(this.scene, this.camera);
    this.unsub.push(this.s.events.on('language:changed', () => this.refreshPrompt(true)));
    this.s.ui.hud.showHint(true);
  }

  exit(): void {
    this.persistLocation();
    this.s.save.flush();
    this.s.ui.prompt.hide();
    this.s.ui.prompt.hideBubble();
    this.unsub.forEach((u) => u());
    this.view.dispose();
    this.mapView.dispose();
    this.lights.dispose();
  }

  update(dt: number): void {
    const input = this.s.input.state;
    if (input.menuPressed) this.s.ui.settings.toggle();

    if (this.s.flags.debug && input.debugKey) {
      this.player.playEmote(ANIM_STATES[input.debugKey - 1], 1.5);
    }

    this.player.update(dt, { x: input.moveX, y: -input.moveY, run: input.runHeld }, this.map);
    if (input.moveX !== 0 || input.moveY !== 0) this.s.ui.hud.showHint(false);

    this.nearby = this.findNearby();
    if (input.interactPressed && this.nearby) {
      if (this.bubbleFor?.id === this.nearby.id) {
        this.closeBubble();
      } else {
        const it = this.nearby;
        this.player.facing = facingFromVector(it.x - this.player.x, it.y - this.player.y, this.player.facing);
        this.player.playEmote('talk', EMOTE_SECONDS.talk);
        this.bubbleFor = it;
        this.s.events.emit('player:interacted', { targetId: it.id });
      }
    } else if (input.actionPressed) {
      this.player.playEmote('celebrate', EMOTE_SECONDS.celebrate);
    }
    if (this.bubbleFor && this.nearby?.id !== this.bubbleFor.id) this.closeBubble();

    this.saveTimer += dt;
    if (this.saveTimer > 1) {
      this.saveTimer = 0;
      this.persistLocation();
    }
  }

  render(alpha: number, frameDt: number): void {
    const p = this.player;
    const x = p.prevX + (p.x - p.prevX) * alpha;
    const y = p.prevY + (p.y - p.prevY) * alpha;
    this.view.play(p.animState, p.facing);
    this.view.update(frameDt, x, y);
    if (this.debugPlayer) this.debugPlayer.position.set(Math.round(x), -Math.round(y), depth.debug);

    // camera: smooth follow, centered a little above the feet, clamped to the map
    const px = this.s.pixel;
    const k = 1 - Math.exp(-frameDt * 7);
    this.cam.x += (x - this.cam.x) * k;
    this.cam.y += (y - 16 - this.cam.y) * k;
    this.cam.x = clampView(this.cam.x, px.viewW, this.map.widthPx);
    this.cam.y = clampView(this.cam.y, px.viewH, this.map.heightPx);

    this.lights.update(frameDt);
    this.refreshPrompt(false);
    px.render(this.scene, this.camera, this.cam.x, this.cam.y);
  }

  resize(): void {
    this.s.pixel.fitCamera(this.camera);
    this.cam.x = clampView(this.cam.x, this.s.pixel.viewW, this.map.widthPx);
    this.cam.y = clampView(this.cam.y, this.s.pixel.viewH, this.map.heightPx);
  }

  /** Lantern state is presentation of save data (PROGRESSION_SYSTEM §7). */
  private setLantern(id: string, lit: boolean): void {
    this.mapView.setLanternLit(id, lit);
    this.lights.setLanternLit(id, lit);
  }

  private findNearby(): Interactable | null {
    const p = this.player;
    const f = facingVector(p.facing);
    const probeX = p.x + f.x * 10;
    const probeY = p.y - 3 + f.y * 10;
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const it of this.map.interactables) {
      const d = Math.min(Math.hypot(probeX - it.x, probeY - it.y), Math.hypot(p.x - it.x, p.y - it.y) + 4);
      if (d < it.radius && d < bestD) {
        bestD = d;
        best = it;
      }
    }
    return best;
  }

  private closeBubble(): void {
    this.bubbleFor = null;
    this.s.ui.prompt.hideBubble();
  }

  private refreshPrompt(force: boolean): void {
    const ui = this.s.ui;
    const it = this.nearby;
    const label = it ? promptLabel(it) : null;
    this.s.input.touch.setInteractHint(label);
    if (!it) {
      ui.prompt.hide();
      return;
    }
    const at = this.s.pixel.worldToCss(it.x, it.promptY, this.cam.x, this.cam.y);
    if (this.bubbleFor) {
      ui.prompt.hide();
      ui.prompt.showBubble(this.bubbleFor.title, bubbleBody(this.bubbleFor, this.s.save.data.lanterns), at.x, at.y, force);
    } else {
      ui.prompt.show(label!, at.x, at.y, force);
    }
  }

  private persistLocation(): void {
    const p = this.player;
    this.s.save.update((d) => {
      d.location = { mapId: this.map.id, x: Math.round(p.x), y: Math.round(p.y), facing: p.facing };
    }, false);
  }

  private buildDebug(): void {
    const pts: number[] = [];
    const rect = (x: number, y: number, w: number, h: number) => {
      const a = [x, -y], b = [x + w, -y], c = [x + w, -(y + h)], d = [x, -(y + h)];
      for (const [p, q] of [[a, b], [b, c], [c, d], [d, a]]) pts.push(p[0], p[1], 0, q[0], q[1], 0);
    };
    const T = this.map.tile;
    for (let r = 0; r < this.map.rows; r++) {
      for (let c = 0; c < this.map.cols; c++) if (this.map.isBlockedTile(c, r)) rect(c * T, r * T, T, T);
    }
    for (const s of this.map.solids) rect(s.x, s.y, s.w, s.h);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: palette.badge, depthTest: false }));
    lines.position.z = depth.debug;
    lines.renderOrder = 20;
    this.scene.add(lines);

    const body: number[] = [];
    const w = MOVE.bodyW / 2;
    const h = MOVE.bodyH;
    for (const [x0, y0, x1, y1] of [[-w, 0, w, 0], [w, 0, w, h], [w, h, -w, h], [-w, h, -w, 0]]) body.push(x0, y0, 0, x1, y1, 0);
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.Float32BufferAttribute(body, 3));
    this.debugPlayer = new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({ color: palette.xp, depthTest: false }));
    this.debugPlayer.renderOrder = 21;
    this.scene.add(this.debugPlayer);
  }
}

function promptLabel(it: Interactable): string {
  switch (it.kind) {
    case 'door':
      return t('prompt.door', { name: it.title });
    case 'lantern':
      return t('prompt.look');
    default:
      return t('prompt.read');
  }
}

function bubbleBody(it: Interactable, lit: string[]): string {
  if (it.kind !== 'lantern') return it.body;
  const topic = it.topicName ?? '';
  return lit.includes(it.id.replace(/^lantern-/, '')) ? t('lantern.lit', { topic }) : t('lantern.dark', { topic });
}

function clampView(c: number, view: number, size: number): number {
  if (size <= view) return size / 2;
  return Math.max(view / 2, Math.min(size - view / 2, c));
}
