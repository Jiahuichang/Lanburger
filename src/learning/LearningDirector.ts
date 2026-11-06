import type { Services } from '../core/Services';
import type { LoadedPortrait } from '../character/types';
import { TOPICS, packFor } from '../content/learning';
import { SUPPORT_TEXTS } from '../content/learning/support';
import { t } from '../i18n';
import { ENERGY_MAX } from '../save/schema';
import { LessonSession, type Mode } from './LessonSession';
import { due, graded, learned, taught, vocabKey } from './Srs';
import { XP } from '../progress/Progression';

/** Energy a finished Practice Corner round gives back (PROGRESSION_SYSTEM §3). */
export const PRACTICE_REWARD = 5;

export interface Teacher {
  name: string;
  portrait?: LoadedPortrait;
}

/**
 * Glue between the learning engine, the save and the lesson UI: builds sessions from content packs,
 * records spaced-repetition grades, spends energy on wrong answers (never below zero) and gives energy
 * back for free practice. No lesson can be blocked by energy (PROGRESSION_SYSTEM §3).
 */
export class LearningDirector {
  constructor(private s: Services) {}

  /** Teach one lesson. Resolves true when finished. */
  async runLesson(topicId: string, lessonId: string, teacher?: Teacher): Promise<boolean> {
    const topic = TOPICS[topicId];
    const lesson = topic?.lessons.find((l) => l.id === lessonId);
    const { targetLanguage: target, supportLanguage: support } = this.s.save.data.profile;
    const pack = topic && packFor(topicId, target);
    if (!topic || !lesson || !pack) return false;
    const texts = SUPPORT_TEXTS[support];
    const outOfEnergy = this.s.save.data.stats.energy <= 0;
    const session = new LessonSession({
      mode: 'lesson',
      topic,
      pack,
      lesson,
      target,
      support,
      texts,
      speaker: teacher?.name ?? 'Maggie',
      introNote: outOfEnergy ? texts.outOfEnergy : undefined,
      ...this.recorders('lesson'),
    });
    const done = await this.s.ui.lesson.open(session, { title: lesson.title, target, support, teacher });
    if (done) {
      this.s.save.update((d) => {
        d.flags[`lesson:${lessonId}`] = true;
        if (topic.lessons.every((l) => d.flags[`lesson:${l.id}`])) d.flags[`topic:${topicId}`] = true;
      });
      this.s.save.flush();
      this.s.progress.gainXp(XP.lesson);
      this.s.progress.refresh();
    }
    return done;
  }

  /**
   * A townsperson chats with the player using a topic's phrases (reply questions, no energy cost).
   * Finishing sets "practiced:<topic>" for quests.
   */
  async runChat(topicId: string, partner: Teacher): Promise<boolean> {
    const topic = TOPICS[topicId];
    const { targetLanguage: target, supportLanguage: support } = this.s.save.data.profile;
    const pack = topic && packFor(topicId, target);
    if (!topic || !pack) return false;
    const session = new LessonSession({
      mode: 'chat',
      topic,
      pack,
      target,
      support,
      texts: SUPPORT_TEXTS[support],
      speaker: partner.name,
      ...this.recorders('chat'),
    });
    const done = await this.s.ui.lesson.open(session, { title: t('learn.chatTitle', { name: partner.name }), target, support, teacher: partner, doneLabel: t('learn.chatDone') });
    if (done) {
      this.s.save.update((d) => void (d.flags[`practiced:${topicId}`] = true));
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
    const topic = TOPICS.greetings;
    const pack = packFor(topic.id, target);
    if (!pack) return false;
    const session = new LessonSession({
      mode,
      topic,
      pack,
      items: items.filter((id) => pack.forms[id]),
      target,
      support,
      texts: SUPPORT_TEXTS[support],
      speaker: teacher?.name ?? 'Maggie',
      ...this.recorders(mode),
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
    };
  }
}
