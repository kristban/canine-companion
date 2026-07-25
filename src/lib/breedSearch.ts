// Instant, typo-tolerant search over the breed catalog by name.
//
// Like match.ts, this is pure data-in / data-out with no framework imports, so
// it's trivially testable and runs client-side on every keystroke. There is no
// search dependency (Fuse.js et al.) — the catalog is small and the matching we
// need is simple, so a compact hand-rolled matcher keeps the bundle lean and
// the behavior predictable. See docs/data-model.md for the Breed shape.

import { Breed } from "./breeds";

/**
 * Fold a string to a comparable form: lowercase, strip accents, and collapse
 * any run of non-alphanumeric characters (punctuation, hyphens) to a single
 * space. "Cavalier King Charles Spaniel" and "cavalier-king-charles-spaniel"
 * normalize to the same words.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Levenshtein edit distance (insertions, deletions, substitutions), used for
 * typo tolerance. Breed names are short, so the classic two-row DP is plenty
 * fast; `max` lets callers bail out early once a candidate is clearly too far.
 */
function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    // Every remaining edit can only add distance, so if the whole row already
    // exceeds `max` there's no point finishing.
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
}

/**
 * How many typos to forgive for a query of the given length. Short queries get
 * little slack (so "lab" doesn't fuzzily match half the catalog); longer ones
 * tolerate the odd transposition or dropped letter ("huksy" → "husky",
 * "labradore" → "labrador").
 */
function fuzzyThreshold(length: number): number {
  if (length <= 2) return 0;
  if (length <= 4) return 1;
  if (length <= 8) return 2;
  return 3;
}

// Lower score = better match. Direct (prefix/substring) matches always rank
// ahead of fuzzy ones; within the fuzzy band, fewer edits rank higher.
const SCORE = {
  nameStartsWith: 0,
  wordStartsWith: 1,
  substring: 2,
  fuzzyBase: 3,
} as const;

const NO_MATCH = Number.POSITIVE_INFINITY;

/** Score one breed name against an already-normalized, non-empty query. */
function scoreName(name: string, query: string): number {
  if (name.startsWith(query)) return SCORE.nameStartsWith;

  const words = name.split(" ");
  if (words.some((word) => word.startsWith(query))) return SCORE.wordStartsWith;

  if (name.includes(query)) return SCORE.substring;

  // No direct hit — allow a few typos against the whole name or any single word.
  const threshold = fuzzyThreshold(query.length);
  if (threshold === 0) return NO_MATCH;

  let best = threshold + 1;
  for (const candidate of [name, ...words]) {
    best = Math.min(best, editDistance(query, candidate, threshold));
    if (best === 0) break;
  }
  return best <= threshold ? SCORE.fuzzyBase + best : NO_MATCH;
}

/**
 * Filter + rank breeds by how well their name matches `query`. An empty query
 * returns every breed sorted alphabetically (the gallery's default order).
 * Matches are sorted best-first, ties broken alphabetically so the order is
 * stable as the user types.
 */
export function searchBreeds(query: string, breeds: Breed[]): Breed[] {
  const byName = (a: Breed, b: Breed) => a.name.localeCompare(b.name);

  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [...breeds].sort(byName);

  return breeds
    .map((breed) => ({ breed, score: scoreName(normalize(breed.name), normalizedQuery) }))
    .filter((entry) => entry.score !== NO_MATCH)
    .sort((a, b) => a.score - b.score || byName(a.breed, b.breed))
    .map((entry) => entry.breed);
}
