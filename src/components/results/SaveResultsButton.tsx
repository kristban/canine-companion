"use client";

// "Save these results" action on the results screen.
// - Signed in  → insert a snapshot into `saved_results` (browser client + RLS).
// - Signed out → stash the results in sessionStorage and start Google sign-in,
//   returning to /?savePending=1 so AppShell can restore them (they live only
//   in React state otherwise and wouldn't survive the redirect).

import Link from "next/link";
import { useState } from "react";
import type { MatchResult } from "@/lib/match";
import type { QuizOption } from "@/lib/questions";
import { useSession } from "@/components/SessionProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SAVED_RESULTS_TABLE,
  buildSnapshot,
  snapshotTitle,
  stashPendingResults,
} from "@/lib/results";

interface SaveResultsButtonProps {
  results: MatchResult[];
  answers: QuizOption[];
}

type Status = "idle" | "saving" | "saved" | "error";

export function SaveResultsButton({ results, answers }: SaveResultsButtonProps) {
  const { user, loading } = useSession();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSave() {
    if (!user) {
      // Preserve the results through the OAuth round-trip, then sign in.
      stashPendingResults({ results, answers });
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/?savePending=1")}`,
        },
      });
      return;
    }

    setStatus("saving");
    const supabase = getSupabaseBrowserClient();
    const snapshot = buildSnapshot(results, answers);
    const { error } = await supabase.from(SAVED_RESULTS_TABLE).insert({
      title: snapshotTitle(results),
      results: snapshot.results,
      answers: snapshot.answers,
    });
    setStatus(error ? "error" : "saved");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {status === "saved" ? (
        <div
          role="status"
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-secondary/30 px-5 py-4 text-center shadow-hard-sm"
        >
          <p className="text-sm font-bold text-text">
            🎉 Saved to your account.
          </p>
          <Link
            href="/results"
            className="transition-smooth text-sm font-bold text-primary underline hover:no-underline"
          >
            View in My results →
          </Link>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || status === "saving"}
            className="transition-smooth inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-8 py-3 text-base font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span aria-hidden="true">💾</span>
            {status === "saving" ? "Saving…" : "Save these results"}
          </button>
          {!user && !loading ? (
            <p className="text-xs font-semibold text-muted">
              Sign in with Google to keep your results.
            </p>
          ) : null}
          {status === "error" ? (
            <p role="alert" className="text-sm font-semibold text-red-700">
              Couldn&apos;t save your results. Please try again.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
