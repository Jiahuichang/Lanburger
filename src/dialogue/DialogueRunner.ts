import type { DialogueGraph, DialogueLine } from './types';

/**
 * Walks a dialogue graph. Pure logic: the UI asks for the current line and tells the runner when the
 * player advances or picks a choice. Flags are reported through `onFlag` so the save stays outside.
 */
export class DialogueRunner {
  private id: string | null;

  constructor(
    private graph: DialogueGraph,
    private onFlag: (flag: string) => void = () => {},
  ) {
    this.id = graph.start;
    this.enter();
  }

  get line(): DialogueLine | null {
    return this.id ? (this.graph.lines[this.id] ?? null) : null;
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
    const c = this.line?.choices?.[index];
    if (!c) return;
    if (c.set) this.onFlag(c.set);
    this.id = c.next ?? null;
    this.enter();
  }

  private enter(): void {
    const l = this.line;
    if (l?.set) this.onFlag(l.set);
  }
}
