// In-progress quiz answers, persisted to sessionStorage so an accidental
// refresh doesn't wipe them. Client-only, best-effort (same try/catch pattern
// as the pending-results bridge in results.ts). Cleared whenever the quiz is
// completed or explicitly abandoned/restarted (see AppShell).

import type { QuizOption } from "./questions";

const PROGRESS_KEY = "cc:quiz-progress";

export interface QuizProgress {
  step: number;
  answers: QuizOption[];
}

export function saveQuizProgress(progress: QuizProgress): void {
  try {
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // sessionStorage unavailable (private mode / disabled) — best-effort.
  }
}

export function readQuizProgress(): QuizProgress | null {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as QuizProgress) : null;
  } catch {
    return null;
  }
}

export function clearQuizProgress(): void {
  try {
    sessionStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}
