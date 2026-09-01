"use client";

// Small client island so Results.tsx itself can stay a server component (see
// docs/conventions.md — interactivity should live in the smallest possible
// child). Toggles between the server-rendered ranked list and a client-side
// trait-comparison table for the same top breeds.

import { useState, type ReactNode } from "react";
import type { Breed } from "@/lib/breeds";
import { TraitCompareTable } from "@/components/TraitCompareTable";

interface ResultsViewToggleProps {
  topBreeds: Breed[];
  listView: ReactNode;
}

type Mode = "list" | "compare";

export function ResultsViewToggle({
  topBreeds,
  listView,
}: ResultsViewToggleProps) {
  const [mode, setMode] = useState<Mode>("list");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Results view"
        className="mb-4 inline-flex gap-1 rounded-full border-2 border-border bg-background-alt p-1"
      >
        {(
          [
            { id: "list", label: "Ranked list" },
            { id: "compare", label: "Compare traits" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`transition-smooth rounded-full px-4 py-1.5 text-sm font-bold ${
              mode === tab.id
                ? "border-2 border-border bg-surface text-text shadow-hard-sm"
                : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "list" ? listView : <TraitCompareTable breeds={topBreeds} />}
    </div>
  );
}
