import * as THREE from 'three';
import type { Scene, SceneContext, ReturnPoint } from '../core/Scene';
import type { Services } from '../core/Services';
import { depth, palette } from '../art/tokens';
import { ANIM_STATES, facingFromVector, facingVector } from '../character/types';
import { loadHeroPortrait, loadHeroSprite } from '../character/hero';
import { loadNpcPortrait, loadNpcSprite, loadPetSprite } from '../character/npcs';
import { MAPS } from '../content/maps';
import { NPCS } from '../content/npcs';
import { DIALOGUES } from '../content/dialogues/hello-town';
import type { NpcDefinition } from '../npc/types';
import { NpcBrain, PetBrain, withBodies, type Body } from '../npc/NpcBrain';
import { DialogueRunner } from '../dialogue/DialogueRunner';
import { LearningDirector, type Teacher } from '../learning/LearningDirector';
import type { DialogueGraph } from '../dialogue/types';
import type { SpeakerInfo } from '../ui/DialogueBox';
import { paintBalloon } from '../art/painted/props';
import { assets, type SpriteImage } from '../assets/AssetRegistry';
import { placeSprite } from '../render/sprites';
import { t } from '../i18n';
import { START_MAP } from '../save/schema';
import { QUESTS } from '../content/quests';
import { currentGoals, isCurrentStep } from '../quest/QuestSystem';
import { lanternsOn } from '../content/places';
import type { MapMarker } from '../ui/Minimap';
import { ActorView } from '../render/ActorView';
import { LightLayer } from '../render/LightLayer';
import { TileMapView } from '../render/TileMapView';
import { TileMap, type Interactable, type Warp } from './map/TileMap';
import { MOVE, TopDownMover, type Collider } from './TopDownMover';

const EMOTE_SECONDS = { celebrate: 0.6, incorrect: 0.9, talk: 0.8, learn: 1.2 } as const;
const PLAYER_ID = 'player';
/** Walking this close (map px) to a building's door counts as exploring it. */
const EXPLORE_RADIUS = 44;

/** Where to put the player when arriving through a door (scene params). */
export interface WarpParams {
  mapId: string;
  spawn: string;
}

interface NpcActor {
  def: NpcDefinition;
  brain: NpcBrain;
  view: ActorView;
  balloon: THREE.Mesh;
  interactable: Interactable;
}

interface PetActor {
  owner: NpcActor;
  brain: PetBrain;
  view: ActorView;
  interactable: Interactable;
  name: string;
  line: string;
}

/**
 * Top-down map scene (IMPLEMENTATION_PLAN §4): loads a map by id, the player, NPCs with simple brains,
 * doors between maps, and conversations through the dialogue box.
 */
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
  private npcs: NpcActor[] = [];
  private pets: PetActor[] = [];
  private balloons!: { quest: SpriteImage; turnIn: SpriteImage; chat: SpriteImage };
  private time = 0;
  private cam = { x: 0, y: 0 };
  private nearby: Interactable | null = null;
  private bubbleFor: Interactable | null = null;
  /** Interactable id of whoever we're talking to in the dialogue box. */
  private talkingTo: string | null = null;
  private leaving = false;
  private saveTimer = 0;
  private debugPlayer?: THREE.LineSegments;
  private unsub: (() => void)[] = [];
  private playerCollider!: Collider;
  private learning!: LearningDirector;
  /** A lesson, review or conversation is running. */
  private busy = false;
  /** NPC ids the current quest steps point at ('!' or '?' for a turn-in). */
  private goalNpcs = new Map<string, 'quest' | 'turnIn'>();
  private goalTimer = 0;
  private chromeShown = true;

  async enter(ctx: SceneContext): Promise<void> {
    this.s = ctx.services;
    const save = this.s.save.data;
    const rp = ctx.params?.returnPoint as ReturnPoint | undefined;
    const warp = ctx.params?.warp as WarpParams | undefined;
    const mapId = warp?.mapId ?? rp?.mapId ?? save.location.mapId;
    this.map = new TileMap(MAPS[mapId] ?? MAPS[START_MAP]);

    this.mapView = new TileMapView(this.map, save.settings.reducedMotion);
    this.scene.add(this.mapView.object);
    this.lights = new LightLayer(
      [...this.map.lights, ...this.mapView.artLights],
      { w: this.map.widthPx, h: this.map.heightPx },
      save.settings.reducedMotion,
      this.map.indoor,
    );
    this.scene.add(this.lights.object);
    for (const id of save.lanterns) this.setLantern(`lantern-${id}`, true);
    this.s.save.update((d) => void (d.flags[`visited:${this.map.id}`] = true), false);

    const saved = save.location.mapId === this.map.id && Number.isFinite(save.location.x) ? save.location : null;
    const start = warp ? this.map.spawn(warp.spawn) : (rp ?? saved ?? this.map.spawn());
    this.player = new TopDownMover(start.x, start.y, start.facing);
    if (this.map.collides(start.x - MOVE.bodyW / 2, start.y - MOVE.bodyH, MOVE.bodyW, MOVE.bodyH)) {
      const sp = this.map.spawn();
      this.player.place(sp.x, sp.y, sp.facing);
    }
    this.playerCollider = withBodies(this.map, () => this.bodies(), PLAYER_ID);

    this.view = new ActorView(await this.heroSprite());
    this.scene.add(this.view.object);
    this.s.ui.hud.setPortrait(await loadHeroPortrait(), 'neutral');
    await this.spawnNpcs();
    this.s.ui.minimap.setMap(this.map, save.lanterns, this.lanternCount());
    this.s.music.play(MAPS[this.map.id]?.music ?? null);

    this.cam = { x: this.player.x, y: this.player.y - 16 };
    if (this.s.flags.debug) this.buildDebug();
    this.s.pixel.fitCamera(this.camera);
    this.s.pixel.compile(this.scene, this.camera);
    this.learning = new LearningDirector(this.s);
    this.unsub.push(this.s.events.on('language:changed', () => this.refreshPrompt(true)));
    this.unsub.push(this.s.events.on('ui:learn', () => void this.study('review')));
    this.unsub.push(this.s.events.on('hero:changed', () => void this.reloadHero()));
    this.unsub.push(this.s.events.on('lantern:lit', ({ topic }) => this.onLanternLit(topic)));
    this.unsub.push(this.s.events.on('quest:changed', () => this.refreshGoals()));
    if (!warp) this.s.ui.hud.showHint(true);
    // start the first quest, count this visit, and catch up on anything done before quests existed
    this.s.progress.refresh();
    this.refreshGoals();
  }

  exit(): void {
    this.persistLocation();
    this.s.save.flush();
    this.s.ui.prompt.hide();
    this.s.ui.prompt.hideBubble();
    this.unsub.forEach((u) => u());
    this.view.dispose();
    this.npcs.forEach((n) => n.view.dispose());
    this.pets.forEach((p) => p.view.dispose());
    this.mapView.dispose();
    this.lights.dispose();
  }

  update(dt: number): void {
    const input = this.s.input.state;
    if (input.menuPressed && !this.s.ui.dialogue.isOpen && (this.s.ui.settings.isOpen || !this.s.ui.anyPanelOpen)) this.s.ui.settings.toggle();

    if (this.s.flags.debug && input.debugKey) this.player.playEmote(ANIM_STATES[input.debugKey - 1], 1.5);

    this.player.update(dt, { x: input.moveX, y: -input.moveY, run: input.runHeld }, this.playerCollider);
    if (input.moveX !== 0 || input.moveY !== 0) this.s.ui.hud.showHint(false);

    // NPCs and pets
    const senses = (id: string) => ({ playerX: this.player.x, playerY: this.player.y, talking: this.talkingTo === id || this.bubbleFor?.id === id });
    for (const n of this.npcs) {
      n.brain.update(dt, senses(n.interactable.id), withBodies(this.map, () => this.bodies(), n.brain.id));
      n.interactable.x = n.brain.x;
      n.interactable.y = n.brain.y + 2;
      n.interactable.promptY = n.brain.y - 62;
    }
    for (const p of this.pets) {
      p.brain.update(dt, { x: p.owner.brain.x, y: p.owner.brain.y }, senses(p.interactable.id), withBodies(this.map, () => this.bodies(), p.brain.id));
      p.interactable.x = p.brain.mover.x;
      p.interactable.y = p.brain.mover.y + 2;
      p.interactable.promptY = p.brain.mover.y - 22;
    }

    // interactions
    this.nearby = this.s.ui.dialogue.isOpen ? null : this.findNearby();
    if (input.interactPressed && this.nearby) {
      this.interact(this.nearby);
    } else if (input.actionPressed) {
      this.player.playEmote('celebrate', EMOTE_SECONDS.celebrate);
    }
    if (this.bubbleFor && this.nearby?.id !== this.bubbleFor.id) this.closeBubble();

    // doors
    const w = this.warpUnderPlayer(input.moveX, -input.moveY);
    if (w) this.useWarp(w.to, w.spawn);

    this.checkExplored();
    this.goalTimer += dt;
    if (this.goalTimer > 0.5) {
      this.goalTimer = 0;
      this.refreshGoals();
    }

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
    this.time += frameDt;
    for (const n of this.npcs) {
      const m = n.brain.mover;
      const nx = m.prevX + (m.x - m.prevX) * alpha;
      const ny = m.prevY + (m.y - m.prevY) * alpha;
      const talking = this.talkingTo === n.interactable.id;
      n.view.play(n.brain.animState(talking), n.brain.facing);
      n.view.update(frameDt, nx, ny);
      const goal = this.goalNpcs.get(n.def.id);
      this.setBalloon(n, goal === 'turnIn' ? 'turnIn' : goal ? 'quest' : 'chat');
      n.balloon.visible = !talking;
      n.balloon.position.set(Math.round(nx), -Math.round(ny - 50 + Math.round(Math.sin(this.time * 3) * 1.5)), n.balloon.position.z);
    }
    for (const pet of this.pets) {
      const m = pet.brain.mover;
      pet.view.play(m.moving ? 'walk' : this.talkingTo === pet.interactable.id ? 'talk' : 'idle', m.facing);
      pet.view.update(frameDt, m.prevX + (m.x - m.prevX) * alpha, m.prevY + (m.y - m.prevY) * alpha);
    }
    if (this.debugPlayer) this.debugPlayer.position.set(Math.round(x), -Math.round(y), depth.debug);

    // camera: smooth follow, centered a little above the feet, clamped to the map
    const px = this.s.pixel;
    const k = 1 - Math.exp(-frameDt * 7);
    this.cam.x += (x - this.cam.x) * k;
    this.cam.y += (y - 16 - this.cam.y) * k;
    this.cam.x = clampView(this.cam.x, px.viewW, this.map.widthPx);
    this.cam.y = clampView(this.cam.y, px.viewH, this.map.heightPx);

    this.lights.update(frameDt);
    this.mapView.update(frameDt);
    this.refreshPrompt(false);
    this.s.ui.minimap.update(x, y);
    const chrome = !this.busy && !this.s.ui.dialogue.isOpen && !this.s.ui.lesson.isOpen;
    if (chrome !== this.chromeShown) {
      this.chromeShown = chrome;
      this.s.ui.tracker.setVisible(chrome);
      this.s.ui.minimap.setVisible(chrome);
    }
    px.render(this.scene, this.camera, this.cam.x, this.cam.y);
  }

  resize(): void {
    this.s.pixel.fitCamera(this.camera);
    this.cam.x = clampView(this.cam.x, this.s.pixel.viewW, this.map.widthPx);
    this.cam.y = clampView(this.cam.y, this.s.pixel.viewH, this.map.heightPx);
  }

  // ───────────────────────── interaction

  private interact(it: Interactable): void {
    this.player.facing = facingFromVector(it.x - this.player.x, it.y - this.player.y, this.player.facing);
    this.s.events.emit('player:interacted', { targetId: it.id });
    if (it.kind !== 'npc') this.s.progress.refresh({ type: 'interact', target: it.id });
    if (it.warp) {
      this.useWarp(it.warp.to, it.warp.spawn);
      return;
    }
    if (it.kind === 'npc') {
      this.closeBubble();
      void this.talk(it);
      return;
    }
    if (it.activity === 'practice') {
      void this.study('practice');
      return;
    }
    // signs, locked doors and lanterns use the small speech bubble
    if (this.bubbleFor?.id === it.id) this.closeBubble();
    else {
      this.player.playEmote('talk', EMOTE_SECONDS.talk);
      this.bubbleFor = it;
    }
  }

  private async talk(it: Interactable): Promise<void> {
    const graph = this.dialogueFor(it);
    if (!graph || this.busy) return;
    this.busy = true;
    this.talkingTo = it.id;
    this.player.emote = 'talk';
    const flags = this.s.save.data.flags;
    const runner = new DialogueRunner(
      graph,
      (flag) => this.s.save.update((d) => void (d.flags[flag] = true)),
      (flag) => !!flags[flag],
    );
    const speakers = await this.speakersFor(graph);
    this.s.save.update((d) => {
      if (!d.seenDialogues.includes(graph.id)) d.seenDialogues.push(graph.id);
    }, false);
    await this.s.ui.dialogue.open(runner, (id) => speakers.get(id) ?? { name: id });
    this.talkingTo = null;
    this.player.emote = null;
    // story flags matter: write them now rather than waiting for the autosave
    this.s.save.flush();
    this.busy = false;
    const npc = this.npcs.find((x) => x.interactable === it);
    if (npc) this.s.progress.refresh({ type: 'talk', target: npc.def.id });
    for (const action of runner.actions) await this.runAction(action, it);
  }

  private dialogueFor(it: Interactable): DialogueGraph | null {
    const pet = this.pets.find((p) => p.interactable === it);
    if (pet) return { id: `pet.${pet.name}`, start: 'a', lines: { a: { speaker: pet.interactable.id, text: pet.line } } };
    const n = this.npcs.find((x) => x.interactable === it);
    if (!n) return null;
    const d = this.s.save.data;
    const rule = n.def.dialogues?.find(
      (r) =>
        (!r.flag || !!d.flags[r.flag]) &&
        (!r.step || isCurrentStep(QUESTS, d, r.step)) &&
        (!r.questDone || d.quests[r.questDone]?.status === 'complete') &&
        (r.flag || r.step || r.questDone) &&
        DIALOGUES[r.id],
    );
    const after = n.def.dialogueAfter;
    const id = rule ? rule.id : after && d.flags[after.flag] ? after.id : n.def.dialogueId;
    return (
      DIALOGUES[id] ??
      (n.def.greeting ? { id: `${n.def.id}.greeting`, start: 'a', lines: { a: { speaker: n.def.id, text: n.def.greeting } } } : null)
    );
  }

  /** Actions requested by a conversation: "lesson:<topic>/<lesson>", "chat:<topic>" or "practice". */
  private async runAction(action: string, it: Interactable): Promise<void> {
    const teacher = await this.teacherFor(it);
    if (action === 'practice') {
      await this.study('practice', teacher);
      return;
    }
    const chat = /^chat:([\w-]+)$/.exec(action);
    if (chat) {
      this.busy = true;
      this.player.emote = 'learn';
      const done = await this.learning.runChat(chat[1], teacher);
      this.player.emote = null;
      this.busy = false;
      if (done) this.player.playEmote('celebrate', EMOTE_SECONDS.celebrate);
      return;
    }
    const m = /^lesson:([\w-]+)\/([\w-]+)$/.exec(action);
    if (!m) return;
    this.busy = true;
    this.player.emote = 'learn';
    const done = await this.learning.runLesson(m[1], m[2], teacher);
    this.player.emote = null;
    this.busy = false;
    if (!done) return;
    this.player.playEmote('celebrate', EMOTE_SECONDS.celebrate);
    // the teacher's closing line
    const finishedTopic = !!this.s.save.data.flags[`topic:${m[1]}`];
    const npcId = it.id.replace(/^npc:/, '');
    const closing: DialogueGraph = DIALOGUES[`${npcId}.${finishedTopic ? 'topic-done' : 'lesson-done'}`] ?? {
      id: `${npcId}.after-lesson`,
      start: 'a',
      lines: { a: { speaker: npcId, expression: 'celebrating', text: 'Great job, Lanburger!' } },
    };
    const speakers = await this.speakersFor(closing);
    this.busy = true;
    this.talkingTo = it.id;
    await this.s.ui.dialogue.open(new DialogueRunner(closing), (id) => speakers.get(id) ?? { name: id });
    this.talkingTo = null;
    this.busy = false;
  }

  /** Review (Learn button) or free practice (Practice Corner, restores energy). */
  private async study(mode: 'review' | 'practice', teacher?: Teacher): Promise<void> {
    if (this.busy || this.s.ui.dialogue.isOpen || this.s.ui.lesson.isOpen) return;
    this.busy = true;
    this.player.emote = 'learn';
    await this.learning.runReview(mode, teacher ?? (await this.teacherFor()));
    this.player.emote = null;
    this.busy = false;
  }

  /** The NPC teaching (or Maggie by default) as name + portrait for the lesson card. */
  private async teacherFor(it?: Interactable): Promise<Teacher> {
    const id = it?.kind === 'npc' ? it.id.replace(/^npc:/, '') : 'maggie';
    const def = NPCS.find((d) => d.id === id) ?? NPCS.find((d) => d.id === 'maggie');
    return { name: def?.name ?? 'Maggie', portrait: def?.portrait ? await loadNpcPortrait(def.portrait) : undefined };
  }

  /** Names and portraits for everyone who speaks in a graph. */
  private async speakersFor(graph: DialogueGraph): Promise<Map<string, SpeakerInfo>> {
    const out = new Map<string, SpeakerInfo>();
    for (const line of Object.values(graph.lines)) {
      const id = line.speaker;
      if (out.has(id)) continue;
      if (id === 'lanburger') {
        out.set(id, { name: this.s.save.data.profile.name || 'Lanburger', portrait: await loadHeroPortrait() });
        continue;
      }
      const pet = this.pets.find((p) => p.interactable.id === id);
      if (pet) {
        out.set(id, { name: pet.name });
        continue;
      }
      const def = NPCS.find((d) => d.id === id);
      if (def) out.set(id, { name: def.name, portrait: def.portrait ? await loadNpcPortrait(def.portrait) : undefined });
    }
    return out;
  }

  // ───────────────────────── progress

  /** First time near a building's door: mark it explored (quests, minimap). */
  private checkExplored(): void {
    const flags = this.s.save.data.flags;
    for (const b of this.map.buildings) {
      if (flags[`explored:${b.id}`]) continue;
      const dx = this.player.x - (b.px + b.pw / 2);
      const dy = this.player.y - (b.py + 8);
      if (dx * dx + dy * dy > EXPLORE_RADIUS * EXPLORE_RADIUS) continue;
      this.s.save.update((d) => void (d.flags[`explored:${b.id}`] = true), false);
      this.s.events.emit('place:explored', { id: b.id });
      this.s.ui.toast(t('explore.found', { name: b.name }));
      this.s.progress.refresh();
    }
  }

  /** Which NPCs get a quest balloon, and where the minimap points (PROGRESSION_SYSTEM §2.4). */
  private refreshGoals(): void {
    const d = this.s.save.data;
    const goals = currentGoals(QUESTS, d);
    this.goalNpcs.clear();
    for (const g of goals) if (g.npc && !this.goalNpcs.has(g.npc)) this.goalNpcs.set(g.npc, g.step.turnIn ? 'turnIn' : 'quest');
    const main = goals[0];
    const markers: MapMarker[] = [];
    if (main) {
      const T = this.map.tile;
      if (main.npc) {
        const def = NPCS.find((n) => n.id === main.npc);
        const live = this.npcs.find((n) => n.def.id === main.npc);
        if (live) markers.push({ x: live.brain.x, y: live.brain.y });
        else if (def) {
          const p = this.pointToward(def.mapId);
          if (p) markers.push(p);
          else if (def.mapId === this.map.id) markers.push({ x: def.x * T, y: def.y * T });
        }
      }
      for (const place of main.places) {
        const b = this.map.buildings.find((x) => x.id === place);
        if (b) markers.push({ x: b.px + b.pw / 2, y: b.py });
        else if (place !== this.map.id) {
          const p = this.pointToward(place);
          if (p) markers.push(p);
        }
      }
    }
    this.s.ui.minimap.setMarkers(markers);
  }

  /** The door or exit on this map that leads to `mapId` (for goals on other maps). */
  private pointToward(mapId: string): MapMarker | null {
    if (mapId === this.map.id) return null;
    const w = this.map.warps.find((x) => x.to === mapId) ?? this.map.warps.find((x) => x.to !== this.map.id);
    return w ? { x: w.rect.x + w.rect.w / 2, y: w.rect.y + w.rect.h / 2 } : null;
  }

  private lanternCount(): { n: number; total: number } | undefined {
    const total = lanternsOn(this.map.id).length;
    return total ? { n: this.s.save.data.lanterns.length, total } : undefined;
  }

  private onLanternLit(topic: string): void {
    this.setLantern(`lantern-${topic}`, true);
    this.s.ui.minimap.setLit(this.s.save.data.lanterns, this.lanternCount());
    this.player.playEmote('celebrate', EMOTE_SECONDS.celebrate * 2);
  }

  private async heroSprite() {
    const save = this.s.save.data;
    const preview = this.s.flags.heroPreview;
    const stage = (['slider', 'classic', 'double', 'deluxe'] as const).find((st) => st === preview?.stage) ?? save.burger.stage;
    return loadHeroSprite(stage, preview?.toppings ?? save.burger.equipped);
  }

  /** Lanburger grew or changed toppings: swap the sprite in place. */
  private async reloadHero(): Promise<void> {
    const sprite = await this.heroSprite();
    const old = this.view;
    this.view = new ActorView(sprite);
    this.scene.add(this.view.object);
    this.scene.remove(old.object);
    old.dispose();
  }

  // ───────────────────────── doors

  /** A warp the player is standing in while pushing toward it (so arriving never re-triggers it). */
  private warpUnderPlayer(ix: number, iy: number): Warp | null {
    if (this.leaving || this.s.ui.dialogue.isOpen) return null;
    const p = this.player;
    const bx = p.x - MOVE.bodyW / 2;
    const by = p.y - MOVE.bodyH;
    for (const w of this.map.warps) {
      const r = w.rect;
      const inside = bx < r.x + r.w && bx + MOVE.bodyW > r.x && by < r.y + r.h && by + MOVE.bodyH > r.y;
      if (!inside) continue;
      const v = facingVector(w.facing);
      if (ix * v.x + iy * v.y > 0.5) return w;
    }
    return null;
  }

  private useWarp(to: string, spawn: string): void {
    if (this.leaving || !MAPS[to]) return;
    this.leaving = true;
    this.closeBubble();
    this.persistLocation();
    void this.s.scenes.goTo('world', { warp: { mapId: to, spawn } satisfies WarpParams });
  }

  // ───────────────────────── NPCs

  private bodies(): Body[] {
    const out: Body[] = [{ id: PLAYER_ID, x: this.player.x - 6, y: this.player.y - 6, w: 12, h: 6 }];
    for (const n of this.npcs) out.push(n.brain.body());
    for (const p of this.pets) out.push(p.brain.body());
    return out;
  }

  /** Place this map's NPCs: a brain, a view, a Talk interactable and a balloon ('!' quest, '…' small talk). */
  private async spawnNpcs(): Promise<void> {
    const T = this.map.tile;
    this.balloons = {
      quest: assets.sprite('ui.balloon.!', () => paintBalloon('!')),
      turnIn: assets.sprite('ui.balloon.?', () => paintBalloon('?')),
      chat: assets.sprite('ui.balloon.…', () => paintBalloon('…')),
    };
    let seed = 1;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (const def of NPCS.filter((n) => n.mapId === this.map.id)) {
      const x = def.x * T;
      const y = def.y * T;
      const brain = new NpcBrain(`npc:${def.id}`, { x, y }, def.facing ?? 'down', (def.wander ?? 0) * T, rand);
      const view = new ActorView(await loadNpcSprite(def.sprite));
      this.scene.add(view.object);
      const b = this.balloonMesh(this.balloons.chat);
      this.scene.add(b);
      const interactable: Interactable = { id: `npc:${def.id}`, kind: 'npc', x, y: y + 2, radius: 22, promptY: y - 62, title: def.name, body: '' };
      this.map.interactables.push(interactable);
      const actor: NpcActor = { def, brain, view, balloon: b, interactable };
      this.npcs.push(actor);

      if (def.pet) {
        const pv = new ActorView(await loadPetSprite(def.pet.kind));
        this.scene.add(pv.object);
        const pi: Interactable = { id: `pet:${def.id}`, kind: 'npc', x: x + 18, y: y + 4, radius: 16, promptY: y - 20, title: def.pet.name, body: '' };
        this.map.interactables.push(pi);
        this.pets.push({ owner: actor, brain: new PetBrain(`pet:${def.id}`, x + 18, y + 2), view: pv, interactable: pi, name: def.pet.name, line: def.pet.line });
      }
    }
  }

  private balloonMesh(img: SpriteImage): THREE.Mesh {
    const b = placeSprite(img.tex, img.w, img.h, img.anchor, 0, 0);
    const mat = b.material as THREE.MeshBasicMaterial;
    mat.transparent = true;
    mat.depthTest = false;
    b.renderOrder = 8;
    b.userData.kind = 'chat';
    return b;
  }

  private setBalloon(n: NpcActor, kind: 'quest' | 'turnIn' | 'chat'): void {
    if (n.balloon.userData.kind === kind) return;
    n.balloon.userData.kind = kind;
    (n.balloon.material as THREE.MeshBasicMaterial).map = this.balloons[kind].tex;
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
    const it = this.busy || ui.lesson.isOpen ? null : this.nearby;
    const label = it ? promptLabel(it) : null;
    this.s.input.touch.setInteractHint(label);
    if (!it) {
      ui.prompt.hide();
      return;
    }
    const at = this.s.pixel.worldToCss(it.x, it.promptY, this.cam.x, this.cam.y);
    if (this.bubbleFor) {
      ui.prompt.hide();
      ui.prompt.showBubble(this.bubbleFor.title, bubbleBody(this.bubbleFor, this.s.save.data), at.x, at.y, force);
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
    for (const w of this.map.warps) rect(w.rect.x, w.rect.y, w.rect.w, w.rect.h);
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
  if (it.warp) return t('prompt.enter');
  switch (it.kind) {
    case 'door':
      return t('prompt.door', { name: it.title });
    case 'lantern':
      return t('prompt.look');
    case 'npc':
      return t('prompt.talk');
    case 'activity':
      return t('prompt.practice');
    default:
      return t('prompt.read');
  }
}

function bubbleBody(it: Interactable, d: { lanterns: string[]; unlockedBuildings: string[] }): string {
  if (it.kind === 'door') return it.buildingId && it.openBody && d.unlockedBuildings.includes(it.buildingId) ? it.openBody : it.body;
  if (it.kind !== 'lantern') return it.body;
  const topic = it.topicName ?? '';
  return d.lanterns.includes(it.id.replace(/^lantern-/, '')) ? t('lantern.lit', { topic }) : t('lantern.dark', { topic });
}

function clampView(c: number, view: number, size: number): number {
  if (size <= view) return size / 2;
  return Math.max(view / 2, Math.min(size - view / 2, c));
}
