import type { Topic } from '../learning/content';
import { t } from '../i18n';
import type { DialogueChoice, DialogueGraph, DialogueLine } from './types';

/**
 * Teachers offer lessons from content, not from hand-written choices, because each language can have its
 * own lessons (Spanish Greetings has six, the other languages three). A choice with
 * `expand: "lessons:<topic>"` becomes:
 *  - "Next: Lesson n: <title>" for the first lesson not finished yet (lessons unlock in order), and
 *  - "Replay a lesson" → a menu of finished lessons, plus "Never mind." back to the same line.
 * Pure: reads flags through `has`, returns a new graph.
 */
export function expandLessonMenus(graph: DialogueGraph, topicFor: (id: string) => Topic | undefined, has: (flag: string) => boolean): DialogueGraph {
  const lines: Record<string, DialogueLine> = { ...graph.lines };
  let changed = false;
  for (const [lineId, line] of Object.entries(graph.lines)) {
    if (!line.choices?.some((c) => c.expand)) continue;
    changed = true;
    const choices: DialogueChoice[] = [];
    for (const c of line.choices) {
      const m = c.expand ? /^lessons:([\w-]+)$/.exec(c.expand) : null;
      const topic = m ? topicFor(m[1]) : undefined;
      if (!c.expand) {
        choices.push(c);
        continue;
      }
      if (!m || !topic) continue;
      const label = (i: number) => t('lessons.item', { n: i + 1, title: topic.lessons[i].title });
      const action = (id: string) => `lesson:${topic.id}/${id}`;
      const next = topic.lessons.findIndex((l) => !has(`lesson:${l.id}`));
      if (next >= 0) choices.push({ text: t('lessons.next', { title: label(next) }), action: action(topic.lessons[next].id) });
      const done = topic.lessons.map((l, i) => ({ l, i })).filter(({ l }) => has(`lesson:${l.id}`));
      if (done.length) {
        const pick = `__replay-${topic.id}`;
        choices.push({ text: t('lessons.replay'), next: pick });
        lines[pick] = {
          speaker: line.speaker,
          expression: 'happy',
          text: next < 0 ? t('lessons.allDone') : t('lessons.pick'),
          choices: [...done.map(({ l, i }) => ({ text: `${label(i)} ✓`, action: action(l.id) })), { text: t('lessons.back'), next: lineId }],
        };
      }
    }
    lines[lineId] = { ...line, choices };
  }
  return changed ? { ...graph, lines } : graph;
}
