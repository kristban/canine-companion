"use client";

// Renders a user's saved result sets with a per-item delete. Delete goes through
// the browser client (RLS ensures a user can only remove their own rows); on
// success the row is dropped from local state.

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SAVED_RESULTS_TABLE, type SavedResultRow } from "@/lib/results";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SavedResultsList({
  initialRows,
}: {
  initialRows: SavedResultRow[];
}) {
  const [rows, setRows] = useState<SavedResultRow[]>(initialRows);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: deleteError } = await supabase
      .from(SAVED_RESULTS_TABLE)
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("Couldn't delete that one. Please try again.");
      setDeletingId(null);
      return;
    }
    setRows((current) => current.filter((row) => row.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-3xl border-3 border-border bg-surface p-6 shadow-hard"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-text">
                {row.title ?? "Saved results"}
              </h2>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-muted">
                Saved {formatDate(row.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(row.id)}
              disabled={deletingId === row.id}
              className="transition-smooth rounded-full border-2 border-border bg-surface px-4 py-2 text-sm font-bold text-red-700 shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-70"
            >
              {deletingId === row.id ? "Deleting…" : "Delete"}
            </button>
          </div>

          <ul className="mt-4 flex flex-col gap-2">
            {row.results.map((match, index) => (
              <li
                key={match.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background-alt px-4 py-2.5"
              >
                <span
                  className="text-xs font-extrabold text-muted"
                  aria-hidden="true"
                >
                  #{index + 1}
                </span>
                <span className="text-xl" aria-hidden="true">
                  {match.emoji}
                </span>
                <span className="flex-1 text-sm font-bold text-text">
                  {match.name}
                </span>
                <span className="rounded-full border-2 border-border bg-secondary px-2.5 py-0.5 text-xs font-extrabold text-ink">
                  {match.matchPercent}% match
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
