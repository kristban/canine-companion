"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Breed, BREED_GROUPS } from "@/lib/breeds";
import { searchBreeds } from "@/lib/breedSearch";
import { useReveal } from "./Reveal";
import { CompareTray } from "./breeds/CompareTray";

// A few at-a-glance traits per card, mirroring the bars in BreedShowcase.
const TRAIT_BARS: { key: keyof Breed; label: string; icon: string }[] = [
  { key: "energy", label: "Energy", icon: "⚡" },
  { key: "grooming", label: "Grooming", icon: "✂️" },
  { key: "trainability", label: "Trainability", icon: "🎓" },
];

const MAX_COMPARE = 3;

// A single breed card, used both by the grouped browse view (nested under a
// group's <h2>, so the card name is an <h3>) and by flat search results
// (no group heading above it, so the card name is an <h2>).
function BreedGridItem({
  breed,
  headingLevel: Heading,
  selected,
  canSelectMore,
  onToggleCompare,
}: {
  breed: Breed;
  headingLevel: "h2" | "h3";
  selected: boolean;
  canSelectMore: boolean;
  onToggleCompare: (id: string) => void;
}) {
  const { ref, className: revealClassName } = useReveal<HTMLLIElement>();

  return (
    <li ref={ref} className={`relative flex ${revealClassName}`}>
      <button
        type="button"
        onClick={() => onToggleCompare(breed.id)}
        disabled={!selected && !canSelectMore}
        aria-pressed={selected}
        aria-label={
          selected
            ? `Remove ${breed.name} from comparison`
            : `Add ${breed.name} to comparison`
        }
        className={`transition-smooth absolute right-4 top-4 z-10 flex h-8 items-center gap-1 rounded-full border-2 border-border px-3 text-xs font-bold shadow-hard-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
          selected
            ? "bg-primary text-white"
            : "bg-surface text-text hover:-translate-y-0.5"
        }`}
      >
        {selected ? "✓ Compare" : "+ Compare"}
      </button>
      <Link
        href={`/breeds/${breed.id}`}
        className="transition-smooth flex flex-1 flex-col gap-4 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-secondary/40 text-4xl"
            aria-hidden="true"
          >
            {breed.emoji}
          </span>
          <div className="min-w-0">
            <Heading className="font-display text-xl font-semibold tracking-tight text-text">
              {breed.name}
            </Heading>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-border bg-accent/40 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-text">
              <span aria-hidden="true">📏</span>
              <span className="capitalize">{breed.size}</span>
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-link">{breed.tagline}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {breed.description}
          </p>
        </div>

        <dl className="mt-auto flex flex-col gap-2">
          {TRAIT_BARS.map((stat) => (
            <div key={stat.key} className="flex items-center gap-3 text-sm">
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
                  style={{ width: `${(Number(breed[stat.key]) / 5) * 100}%` }}
                />
              </dd>
            </div>
          ))}
        </dl>
      </Link>
    </li>
  );
}

interface GroupedBreeds {
  group: (typeof BREED_GROUPS)[number];
  breeds: Breed[];
}

interface BreedSearchProps {
  breeds: Breed[];
  /** Pre-bucketed by breed_group, in canonical order — see breeds/page.tsx. */
  grouped: GroupedBreeds[];
  /** Breeds whose group isn't recognised — shown in a trailing section. */
  ungrouped: Breed[];
}

/**
 * The interactive breed gallery: an empty query shows the grouped browse view
 * (by what each breed was bred to do); typing switches to a flat,
 * typo-tolerant, ranked list of matches via searchBreeds. Filters/searches in
 * the browser on every keystroke — no network round-trip, no persisted state.
 */
export function BreedSearch({ breeds, grouped, ungrouped }: BreedSearchProps) {
  const [query, setQuery] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const inputId = useId();

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, id];
    });
  }

  const trimmed = query.trim();
  const searching = trimmed.length > 0;
  const results = useMemo(
    () => (searching ? searchBreeds(query, breeds) : []),
    [query, searching, breeds],
  );

  const count = results.length;
  const plural = (n: number) => (n === 1 ? "breed" : "breeds");
  const resultSummary = searching
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

      {!searching && (grouped.length > 1 || ungrouped.length > 0) && (
        <nav
          aria-label="Jump to breed group"
          className="sticky top-20 z-10 mt-8 overflow-x-auto rounded-full border-2 border-border bg-background/95 p-1.5 shadow-hard-sm backdrop-blur"
        >
          <div className="flex w-max gap-1.5">
            {grouped.map(({ group, breeds: groupBreeds }) => (
              <a
                key={group.value}
                href={`#group-${group.value}`}
                className="transition-smooth flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-text hover:bg-secondary/40"
              >
                <span aria-hidden="true">{group.emoji}</span>
                {group.label}
                <span className="text-muted">({groupBreeds.length})</span>
              </a>
            ))}
            {ungrouped.length > 0 && (
              <a
                href="#group-other"
                className="transition-smooth flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-text hover:bg-secondary/40"
              >
                <span aria-hidden="true">🐾</span>
                More
              </a>
            )}
          </div>
        </nav>
      )}

      {/* Group headings use scroll-mt-40 (not the site-wide scroll-mt-24)
          because jumping here has two stacked sticky bars to clear: the
          global Header plus this page's own group-jump nav above. */}
      {!searching ? (
        <div className="mt-10 flex flex-col gap-16">
          {grouped.map(({ group, breeds: groupBreeds }) => (
            <section key={group.value} aria-labelledby={`group-${group.value}`}>
              <div className="flex flex-col gap-1">
                <h2
                  id={`group-${group.value}`}
                  className="scroll-mt-40 flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl"
                >
                  <span aria-hidden="true">{group.emoji}</span>
                  {group.label}
                  <span className="text-lg font-bold text-muted">
                    ({groupBreeds.length})
                  </span>
                </h2>
                <p className="text-base leading-relaxed text-muted">
                  {group.blurb}
                </p>
              </div>
              <ul className="mt-6 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groupBreeds.map((breed) => (
                  <BreedGridItem
                    key={breed.id}
                    breed={breed}
                    headingLevel="h3"
                    selected={compareIds.includes(breed.id)}
                    canSelectMore={compareIds.length < MAX_COMPARE}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </ul>
            </section>
          ))}

          {ungrouped.length > 0 && (
            <section aria-labelledby="group-other">
              <h2
                id="group-other"
                className="scroll-mt-40 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl"
              >
                More breeds
              </h2>
              <ul className="mt-6 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ungrouped.map((breed) => (
                  <BreedGridItem
                    key={breed.id}
                    breed={breed}
                    headingLevel="h3"
                    selected={compareIds.includes(breed.id)}
                    canSelectMore={compareIds.length < MAX_COMPARE}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : count > 0 ? (
        <ul className="mt-12 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((breed) => (
            <BreedGridItem
              key={breed.id}
              breed={breed}
              headingLevel="h2"
              selected={compareIds.includes(breed.id)}
              canSelectMore={compareIds.length < MAX_COMPARE}
              onToggleCompare={toggleCompare}
            />
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

      <CompareTray
        breeds={breeds}
        selectedIds={compareIds}
        onRemove={(id) => setCompareIds((current) => current.filter((x) => x !== id))}
        onClear={() => setCompareIds([])}
      />
    </div>
  );
}
