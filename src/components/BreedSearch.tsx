"use client";

import { useId, useMemo, useState } from "react";
import { Breed } from "@/lib/breeds";
import { searchBreeds } from "@/lib/breedSearch";

// A few at-a-glance traits per card, mirroring the bars in BreedShowcase.
const TRAIT_BARS: { key: keyof Breed; label: string; icon: string }[] = [
  { key: "energy", label: "Energy", icon: "⚡" },
  { key: "grooming", label: "Grooming", icon: "✂️" },
  { key: "trainability", label: "Trainability", icon: "🎓" },
];

/**
 * Client-side, instant, typo-tolerant search over the breed gallery. Receives
 * the full catalog as a prop (fetched server-side in breeds/page.tsx) and
 * filters it in the browser on every keystroke via searchBreeds — no network
 * round-trip, no persisted state. Renders the same breed cards the gallery
 * used before, so an empty query looks exactly like the old static grid.
 */
export function BreedSearch({ breeds }: { breeds: Breed[] }) {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const trimmed = query.trim();
  const results = useMemo(() => searchBreeds(query, breeds), [query, breeds]);

  const count = results.length;
  const plural = (n: number) => (n === 1 ? "breed" : "breeds");
  const resultSummary = trimmed
    ? count === 0
      ? `No breeds match “${trimmed}”.`
      : `${count} ${plural(count)} matching “${trimmed}”`
    : `${breeds.length} ${plural(breeds.length)}`;

  return (
    <div className="mt-12">
      <div className="mx-auto max-w-xl">
        <label htmlFor={inputId} className="sr-only">
          Search breeds by name
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl"
          >
            🔍
          </span>
          {/* A plain text input with search semantics rather than
              type="search": Tailwind v4's Lightning CSS strips any
              ::-webkit-search-cancel-button rule, so type="search" would render
              the browser's own clear button alongside our styled one. role +
              inputMode + enterKeyHint keep the search affordances (AT role,
              mobile search keyboard) without that native button. */}
          <input
            id={inputId}
            type="text"
            role="searchbox"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search breeds by name…"
            autoComplete="off"
            className="transition-smooth w-full rounded-full border-3 border-border bg-surface py-3.5 pl-14 pr-14 text-base text-text shadow-hard-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="transition-smooth absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border bg-background text-sm font-bold hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              ✕
            </button>
          ) : null}
        </div>
        <p
          aria-live="polite"
          className="mt-3 text-center text-sm font-semibold text-muted"
        >
          {resultSummary}
        </p>
      </div>

      {count > 0 ? (
        <ul className="mt-12 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((breed) => (
            <li key={breed.id} className="flex">
              <article className="transition-smooth flex flex-1 flex-col gap-4 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-secondary/40 text-4xl"
                    aria-hidden="true"
                  >
                    {breed.emoji}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-text">
                      {breed.name}
                    </h2>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-border bg-accent/40 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-text">
                      <span aria-hidden="true">📏</span>
                      <span className="capitalize">{breed.size}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-primary">
                    {breed.tagline}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {breed.description}
                  </p>
                </div>

                <dl className="mt-auto flex flex-col gap-2">
                  {TRAIT_BARS.map((stat) => (
                    <div
                      key={stat.key}
                      className="flex items-center gap-3 text-sm"
                    >
                      <dt className="flex w-28 shrink-0 items-center gap-1.5 font-semibold text-text">
                        <span aria-hidden="true">{stat.icon}</span>
                        {stat.label}
                      </dt>
                      <dd
                        className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-border bg-background-alt"
                        role="img"
                        aria-label={`${stat.label}: ${breed[stat.key]} out of 5`}
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(Number(breed[stat.key]) / 5) * 100}%`,
                          }}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-auto mt-12 max-w-md rounded-3xl border-3 border-border bg-surface p-8 text-center shadow-hard">
          <p className="text-5xl" aria-hidden="true">
            🐕‍🦺
          </p>
          <p className="mt-3 font-display text-xl font-semibold text-text">
            No matches
          </p>
          <p className="mt-1 text-muted">
            We couldn&apos;t find a breed matching “{trimmed}”. Try a different
            spelling.
          </p>
        </div>
      )}
    </div>
  );
}
