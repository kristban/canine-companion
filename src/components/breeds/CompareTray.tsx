"use client";

// Floating tray for the /breeds gallery: pick 2-3 breeds via the "+ Compare"
// toggle on each card, then view them side-by-side. Selection lives here
// (lifted from BreedSearch) so the tray can persist across a search query.

import { useEffect, useRef, useState } from "react";
import type { Breed } from "@/lib/breeds";
import { TraitCompareTable } from "@/components/TraitCompareTable";

interface CompareTrayProps {
  breeds: Breed[];
  selectedIds: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function CompareTray({
  breeds,
  selectedIds,
  onRemove,
  onClear,
}: CompareTrayProps) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (selectedIds.length === 0) return null;

  const selected = selectedIds
    .map((id) => breeds.find((breed) => breed.id === id))
    .filter((breed): breed is Breed => Boolean(breed));

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Compare breeds"
          className="fixed inset-0 z-40 flex items-end justify-center bg-text/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-3xl border-3 border-border bg-background p-4 shadow-hard sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-text">
                Comparing {selected.length} breeds
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close comparison"
                className="transition-smooth flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-sm font-bold hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                ✕
              </button>
            </div>
            <TraitCompareTable breeds={selected} />
          </div>
        </div>
      )}

      <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border-3 border-border bg-surface px-4 py-3 shadow-hard sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {selected.map((breed) => (
            <span
              key={breed.id}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-background-alt py-1 pl-2.5 pr-1.5 text-xs font-bold text-text"
            >
              <span aria-hidden="true">{breed.emoji}</span>
              {breed.name}
              <button
                type="button"
                onClick={() => onRemove(breed.id)}
                aria-label={`Remove ${breed.name} from comparison`}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-background"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-bold text-muted hover:text-link"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={selected.length < 2}
            className="transition-smooth rounded-full border-2 border-border bg-primary px-4 py-2 text-xs font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-hard-sm"
          >
            Compare
          </button>
        </div>
      </div>
    </>
  );
}
