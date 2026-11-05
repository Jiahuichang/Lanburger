import type { DialogueChoice, DialogueGraph, DialogueLine } from './types';

/**
 * Walks a dialogue graph. Pure logic: the UI asks for the current line and tells the runner when the
 * player advances or picks a choice. Flags are reported through `onFlag` so the save stays outside.
 */
export class DialogueRunner {
  private id: string | null;
  /** Actions requested by the lines and choices the player went through, in order. */
  readonly actions: string[] = [];

  constructor(
    private graph: DialogueGraph,
    private onFlag: (flag: string) => void = () => {},
    private has: (flag: string) => boolean = () => false,
  ) {
    this.id = graph.start;
    this.enter();
  }

  get line(): DialogueLine | null {
    return this.id ? (this.graph.lines[this.id] ?? null) : null;
  }

  /** Choices available right now (filtered by `requires`, labelled with ✓ by `doneIf`). */
  get choices(): DialogueChoice[] {
    return (this.line?.choices ?? [])
      .filter((c) => !c.requires || this.has(c.requires))
      .map((c) => (c.doneIf && this.has(c.doneIf) ? { ...c, text: `${c.text} ✓` } : c));
  }

  get done(): boolean {
    return this.line === null;
  }

  /** Continue past a line without choices. */
  advance(): void {
    const l = this.line;
    if (!l || l.choices?.length) return;
    this.id = l.next ?? null;
    this.enter();
  }

  choose(index: number): void {
    const c = this.choices[index];
    if (!c) return;
    if (c.set) this.onFlag(c.set);
    if (c.action) this.actions.push(c.action);
    this.id = c.next ?? null;
    this.enter();
  }

  private enter(): void {
    const l = this.line;
    if (l?.set) this.onFlag(l.set);
    if (l?.action) this.actions.push(l.action);
  }
}
