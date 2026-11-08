import type { Services } from '../core/Services';
import type { LoadedPortrait } from '../character/types';
import { packFor, topicFor } from '../content/learning';
import { SUPPORT_TEXTS } from '../content/learning/support';
import { t } from '../i18n';
import { ENERGY_MAX } from '../save/schema';
import { canSpeak } from '../audio/Voice';
import { unitOf, type GrammaticalGender, type Topic } from './content';
import { LessonSession, type Mode } from './LessonSession';
import { due, graded, learned, taught, vocabKey } from './Srs';
import { XP } from '../progress/Progression';

/** Energy a finished Practice Corner round gives back (PROGRESSION_SYSTEM §3). */
export const PRACTICE_REWARD = 5;

export interface Teacher {
  name: string;
  portrait?: LoadedPortrait;
}

/** Flag set by a finished practice chat: "practiced:<topic>" or "practiced:<topic>/<chat>". */
export const practicedFlag = (topic: string, chat?: string) => `practiced:${chat ? `${topic}/${chat}` : topic}`;

/**
 * Glue between the learning engine, the save and the lesson UI: builds sessions from content packs,
 * records spaced-repetition grades, spends energy on wrong answers (never below zero) and gives energy
 * back for free practice. No lesson can be blocked by energy (PROGRESSION_SYSTEM §3).
 */
export class LearningDirector {
  constructor(private s: Services) {}

  /** The topic version and pack for the player's language. */
  content(topicId: string): { topic: Topic; pack: NonNullable<ReturnType<typeof packFor>> } | null {
    const target = this.s.save.data.profile.targetLanguage;
    const topic = topicFor(topicId, target);
    const pack = packFor(topicId, target);
    return topic && pack ? { topic, pack } : null;
  }

  /** Teach one lesson. Resolves true when finished. */
  async runLesson(topicId: string, lessonId: string, teacher?: Teacher): Promise<boolean> {
    const c = this.content(topicId);
    const lesson = c?.topic.lessons.find((l) => l.id === lessonId);
    if (!c || !lesson) return false;
    const { targetLanguage: target, supportLanguage: support } = this.s.save.data.profile;
    const texts = SUPPORT_TEXTS[support];
    const outOfEnergy = this.s.save.data.stats.energy <= 0;
    const unit = unitOf(c.topic, lessonId);
    const session = new LessonSession({
      mode: 'lesson',
      topic: c.topic,
      pack: c.pack,
      lesson,
      unitLabel: unit ? t('learn.unitLabel', { n: unit.number, title: unit.title }) : undefined,
      speaker: teacher?.name ?? 'Maggie',
      introNote: outOfEnergy ? texts.outOfEnergy : undefined,
      ...this.common('lesson'),
    });
    const done = await this.s.ui.lesson.open(session, { title: lesson.title, target, support, teacher });
    if (done) {
      this.s.save.update((d) => {
        d.flags[`lesson:${lessonId}`] = true;
        if (c.topic.lessons.every((l) => d.flags[`lesson:${l.id}`])) d.flags[`topic:${topicId}`] = true;
      });
      this.s.save.flush();
      this.s.progress.gainXp(XP.lesson);
      this.s.progress.refresh();
    }
    return done;
  }

  /**
   * A townsperson chats with the player using a topic's phrases (reply questions, no energy cost).
   * `chatId` names one of the topic's chats (e.g. "usted" with Mayor Bun). Finishing sets the practiced
   * flag for quests and units.
   */
  async runChat(topicId: string, partner: Teacher, chatId?: string): Promise<boolean> {
    const c = this.content(topicId);
    if (!c) return false;
    const { targetLanguage: target, supportLanguage: support } = this.s.save.data.profile;
    const chat = c.topic.chats?.[chatId ?? topicId];
    if (chatId && !chat) {
      this.s.ui.toast(t('learn.noChat'));
      return false;
    }
    const session = new LessonSession({ mode: 'chat', topic: c.topic, pack: c.pack, chat, speaker: partner.name, ...this.common('chat') });
    const done = await this.s.ui.lesson.open(session, {
      title: t('learn.chatTitle', { name: partner.name }),
      target,
      support,
      teacher: partner,
      doneLabel: t('learn.chatDone'),
    });
    if (done) {
      this.s.save.update((d) => void (d.flags[practicedFlag(topicId, chatId)] = true));
      this.s.progress.gainXp(XP.reviewRound);
      this.s.progress.refresh();
    }
    this.s.save.flush();
    return done;
  }

  /**
   * Review (Learn button: due items, free) or practice (Practice Corner: any learned items, free,
   * and finishing restores energy). Returns false when there is nothing to study yet.
   */
  async runReview(mode: 'review' | 'practice', teacher?: Teacher): Promise<boolean> {
    const { targetLanguage: target, supportLanguage: support } = this.s.save.data.profile;
    const vocab = this.s.save.data.vocabulary;
    const known = learned(vocab, target);
    if (!known.length) {
      this.s.ui.toast(t('learn.nothingLearned'));
      return false;
    }
    const items = mode === 'review' ? due(vocab, target, Date.now()) : known;
    if (!items.length) {
      this.s.ui.toast(t('learn.nothingDue'));
      return false;
    }
    // review spans every topic the player has started; for now that is Greetings
    const c = this.content('greetings');
    if (!c) return false;
    const boxes = Object.fromEntries(items.map((id) => [id, vocab[vocabKey(target, id)]?.box ?? 0]));
    const session = new LessonSession({
      mode,
      topic: c.topic,
      pack: c.pack,
      items: items.filter((id) => c.pack.forms[id] && c.topic.items.some((x) => x.id === id)),
      boxes,
      speaker: teacher?.name ?? 'Maggie',
      ...this.common(mode),
    });
    const title = mode === 'practice' ? t('learn.practiceTitle') : t('learn.reviewTitle');
    const done = await this.s.ui.lesson.open(session, { title, target, support, teacher });
    if (done) this.s.progress.gainXp(XP.reviewRound);
    if (done && mode === 'practice') {
      const before = this.s.save.data.stats.energy;
      this.s.save.update((d) => {
        d.stats.energy = Math.min(ENERGY_MAX, d.stats.energy + PRACTICE_REWARD);
      });
      const gained = this.s.save.data.stats.energy - before;
      if (gained > 0) this.s.ui.toast(t('energy.restored', { n: gained }));
    }
    this.s.save.flush();
    if (done) this.s.progress.refresh();
    return done;
  }

  /** Session options shared by every mode: language, player, audio, and the save recorders. */
  private common(mode: Mode) {
    const d = this.s.save.data;
    const { targetLanguage: target, supportLanguage: support } = d.profile;
    return {
      target,
      support,
      texts: SUPPORT_TEXTS[support],
      playerName: d.profile.name || 'Lanburger',
      gender: d.profile.grammaticalGender,
      audio: d.settings.listening && canSpeak(target),
      ...this.recorders(mode),
    };
  }

  private recorders(mode: Mode) {
    const target = this.s.save.data.profile.targetLanguage;
    return {
      onTeach: (item: string) =>
        this.s.save.update((d) => {
          const k = vocabKey(target, item);
          d.vocabulary[k] = taught(d.vocabulary[k], item, Date.now());
        }, false),
      onGrade: (item: string, correct: boolean) =>
        this.s.save.update((d) => {
          const k = vocabKey(target, item);
          d.vocabulary[k] = graded(taught(d.vocabulary[k], item, Date.now()), correct, Date.now());
        }, false),
      // XP for answers (PROGRESSION_SYSTEM §4): halved in a lesson taken at zero energy (practice mode, §3)
      onSolve: (firstTry: boolean) =>
        this.s.progress.gainXp(firstTry ? XP.correctFirstTry : XP.correctAfterRetry, mode === 'lesson' && this.s.save.data.stats.energy <= 0),
      onMiss: () => {
        if (mode !== 'lesson') return;
        this.s.save.update((d) => {
          if (d.stats.energy > 0) {
            d.stats.energy -= 1;
            d.stats.energyUpdatedAt = Date.now();
          }
        });
      },
      onGender: (g: GrammaticalGender) => {
        this.s.save.update((d) => void (d.profile.grammaticalGender = g));
        this.s.save.flush();
      },
    };
  }
}
