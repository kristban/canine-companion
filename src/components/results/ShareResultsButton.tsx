"use client";

// Lets a visitor share their top match without needing an account. Uses the
// native share sheet where available (mobile browsers), falling back to a
// clipboard copy + inline confirmation on desktop.

import { useEffect, useRef, useState } from "react";
import type { MatchResult } from "@/lib/match";
import { SITE_NAME, SITE_URL } from "@/lib/site";

interface ShareResultsButtonProps {
  results: MatchResult[];
}

type Status = "idle" | "copied" | "error";

export function ShareResultsButton({ results }: ShareResultsButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const top = results[0];
  if (!top) return null;

  const shareText = `I'm a ${top.matchPercent}% match with the ${top.breed.name} on ${SITE_NAME}! 🐾 Find your match:`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: SITE_URL });
      } catch {
        // User cancelled the share sheet — not an error worth surfacing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${SITE_URL}`);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="transition-smooth rounded-full border-2 border-border bg-surface px-6 py-3 text-sm font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span aria-hidden="true">🔗</span> Share your match
      </button>
      <p role="status" aria-live="polite" className="text-xs font-semibold text-muted">
        {status === "copied" && "Copied to your clipboard!"}
        {status === "error" && "Couldn't copy — try again."}
      </p>
    </div>
  );
}
