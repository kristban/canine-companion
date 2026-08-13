// Saved quiz results — types, the compact DB snapshot, and the sessionStorage
// "bridge" that carries an unsaved result set across the Google OAuth redirect.
//
// Persistence here is per-user and goes through the user's own session + RLS on
// the `saved_results` table (never the service-role key). This is the one
// authorized exception to the site's "results stay in the browser" rule — it
// only happens when a signed-in user explicitly clicks Save.

import type { MatchResult } from "./match";
import { questions, type QuizOption } from "./questions";

export const SAVED_RESULTS_TABLE = "saved_results";

// ---- Compact snapshot persisted to the DB (jsonb columns) ------------------

export interface SavedMatch {
  id: string;
  name: string;
  emoji: string;
  matchPercent: number;
}

export interface SavedAnswer {
  question: string;
  label: string;
  icon: string;
}

/** A row of the `saved_results` table as read back for the /results page. */
export interface SavedResultRow {
  id: string;
  created_at: string;
  title: string | null;
  results: SavedMatch[];
  answers: SavedAnswer[] | null;
}

/** Build the compact snapshot stored in the DB (top 5 breeds + answer recap). */
export function buildSnapshot(
  results: MatchResult[],
  answers: QuizOption[],
): { results: SavedMatch[]; answers: SavedAnswer[] } {
  return {
    results: results.slice(0, 5).map(({ breed, matchPercent }) => ({
      id: breed.id,
      name: breed.name,
      emoji: breed.emoji,
      matchPercent,
    })),
    answers: answers.map((answer, index) => ({
      question: questions[index]?.question ?? "",
      label: answer.label,
      icon: answer.icon,
    })),
  };
}

/** A short human title like "Labrador Retriever + 4 more". */
export function snapshotTitle(results: MatchResult[]): string {
  const top = results[0]?.breed.name;
  if (!top) return "Saved results";
  const extra = Math.min(results.length, 5) - 1;
  return extra > 0 ? `${top} + ${extra} more` : top;
}

// ---- sessionStorage bridge across the OAuth redirect -----------------------

const PENDING_KEY = "cc:pending-results";

export interface PendingResults {
  results: MatchResult[];
  answers: QuizOption[];
}

/** Stash an unsaved result set before starting sign-in (client-only). */
export function stashPendingResults(pending: PendingResults): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // sessionStorage unavailable (private mode / disabled) — save is best-effort.
  }
}

/** Read + return the stashed result set, if any (client-only). */
export function readPendingResults(): PendingResults | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingResults) : null;
  } catch {
    return null;
  }
}

/** Clear the stashed result set (client-only). */
export function clearPendingResults(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}
