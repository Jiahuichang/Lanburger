/**
 * Checking short typed answers (SPANISH_CURRICULUM §7-5): forgiving about capitals, accent marks and
 * ¡ ¿ (with a tip showing the full written form), strict about the words themselves. Pure functions.
 */

export type TypedMatch =
  | { kind: 'exact' }
  /** Right, but accent marks are missing or wrong. */
  | { kind: 'accents' }
  /** Right, but the opening ¡ or ¿ is missing. */
  | { kind: 'marks' }
  /** One letter off: not right yet, but no penalty. */
  | { kind: 'almost' }
  | { kind: 'wrong' };

const PUNCT = /[¡!¿?.,;:"“”'‘’«»…()-]/g;

/** Lower case, no punctuation, single spaces. Keeps accent marks. */
export function loose(s: string): string {
  return s.toLocaleLowerCase().replace(PUNCT, ' ').replace(/\s+/g, ' ').trim();
}

/** `loose` without accent marks. ñ counts as n here too: many keyboards cannot type it (the tip shows it). */
export function bare(s: string): string {
  return loose(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Words of a sentence without punctuation, for order-words questions. */
export function words(s: string): string[] {
  return s
    .split(/\s+/)
    .map((w) => w.replace(PUNCT, ''))
    .filter(Boolean);
}

export function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/**
 * Compare a typed answer with one accepted answer. `{name}` in the accepted answer matches any name of
 * one to three words, so players can introduce themselves by their own name.
 */
export function matchTyped(input: string, accepted: string): TypedMatch {
  if (!input.trim()) return { kind: 'wrong' };
  if (accepted.includes('{name}')) return matchWithName(input, accepted);
  const L = loose(input) === loose(accepted);
  if (L) return missingMarks(input, accepted) ? { kind: 'marks' } : { kind: 'exact' };
  if (bare(input) === bare(accepted)) return { kind: 'accents' };
  const a = bare(input);
  const b = bare(accepted);
  if (b.length >= 4 && editDistance(a, b) === 1) return { kind: 'almost' };
  return { kind: 'wrong' };
}

function matchWithName(input: string, accepted: string): TypedMatch {
  const [pre, post = ''] = accepted.split('{name}');
  const fits = (f: (x: string) => string): boolean => {
    const i = f(input);
    const p = f(pre);
    const q = f(post);
    if (!i.startsWith(p) || !i.endsWith(q)) return false;
    const middle = i.slice(p.length, i.length - q.length);
    if (p && middle && !middle.startsWith(' ')) return false;
    const n = middle.split(' ').filter(Boolean).length;
    return n >= 1 && n <= 3;
  };
  if (fits(loose)) return missingMarks(input, accepted) ? { kind: 'marks' } : { kind: 'exact' };
  if (fits(bare)) return { kind: 'accents' };
  const first = bare(pre).split(' ');
  const got = bare(input).split(' ');
  const near = first.length > 0 && first.every((w, k) => w === got[k] || (w.length >= 4 && editDistance(w, got[k] ?? '') === 1));
  return near && got.length > first.length ? { kind: 'almost' } : { kind: 'wrong' };
}

function missingMarks(input: string, accepted: string): boolean {
  const opens = (s: string) => (s.match(/[¡¿]/g) ?? []).length;
  return opens(accepted) > opens(input);
}

/** Best match of an input against several accepted answers (exact beats a tip beats almost). */
export function bestMatch(input: string, accepted: string[]): { match: TypedMatch; answer: string } {
  const rank = { exact: 0, marks: 1, accents: 2, almost: 3, wrong: 4 } as const;
  let best: { match: TypedMatch; answer: string } = { match: { kind: 'wrong' }, answer: accepted[0] ?? '' };
  for (const a of accepted) {
    const m = matchTyped(input, a);
    if (rank[m.kind] < rank[best.match.kind]) best = { match: m, answer: a };
  }
  return best;
}
