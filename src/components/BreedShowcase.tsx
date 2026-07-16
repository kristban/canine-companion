"use client";

import { useEffect, useState } from "react";
import { Breed, breeds } from "@/lib/breeds";

const SHOWCASE_BREED_IDS = [
  "labrador-retriever",
  "french-bulldog",
  "siberian-husky",
  "standard-poodle",
  "chihuahua",
  "great-dane",
  "border-collie",
  "cavalier-king-charles-spaniel",
];

const showcaseBreeds = SHOWCASE_BREED_IDS.map((id) =>
  breeds.find((breed) => breed.id === id)
).filter((breed): breed is Breed => Boolean(breed));

const traitStats: { key: keyof Breed; label: string; icon: string }[] = [
  { key: "energy", label: "Energy", icon: "⚡" },
  { key: "grooming", label: "Grooming", icon: "✂️" },
  { key: "trainability", label: "Trainability", icon: "🎓" },
  { key: "goodWithKids", label: "Good with kids", icon: "🧒" },
];

const AUTO_ADVANCE_MS = 6000;

export function BreedShowcase() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = showcaseBreeds.length;
  const breed = showcaseBreeds[index];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  function goTo(nextIndex: number) {
    setIndex(((nextIndex % total) + total) % total);
  }

  return (
    <section
      aria-labelledby="breed-showcase-heading"
      className="w-full border-t-3 border-border bg-background"
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2
            id="breed-showcase-heading"
            className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl"
          >
            Meet a few popular breeds
          </h2>
          <p className="mt-3 text-lg text-muted">
            A sneak peek at some of the breeds we can match you with.
          </p>
        </div>

        <div
          className="relative mt-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label="Popular dog breeds"
            className="flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:flex-row sm:items-center sm:p-8"
          >
            <div
              key={breed.id}
              aria-live="polite"
              className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center"
            >
              <div className="flex shrink-0 flex-col items-center text-center sm:w-40">
                <span
                  className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-border bg-secondary/40 text-6xl"
                  aria-hidden="true"
                >
                  {breed.emoji}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-text">
                  {breed.name}
                </h3>
                <p className="mt-1 text-sm font-bold text-primary">
                  {breed.tagline}
                </p>
              </div>

              <div className="flex-1">
                <p className="text-sm leading-relaxed text-muted">
                  {breed.description}
                </p>
                <dl className="mt-4 flex flex-col gap-2.5">
                  {traitStats.map((stat) => (
                    <div
                      key={stat.key}
                      className="flex items-center gap-3 text-sm"
                    >
                      <dt className="flex w-36 shrink-0 items-center gap-1.5 font-semibold text-text">
                        <span aria-hidden="true">{stat.icon}</span>
                        {stat.label}
                      </dt>
                      <dd
                        className="h-3 flex-1 overflow-hidden rounded-full border-2 border-border bg-background-alt"
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
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous breed"
            className="transition-smooth absolute left-0 top-1/2 hidden -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border bg-surface p-2 text-lg shadow-hard-sm hover:-translate-x-5 hover:-translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next breed"
            className="transition-smooth absolute right-0 top-1/2 hidden translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border bg-surface p-2 text-lg shadow-hard-sm hover:translate-x-5 hover:-translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex"
          >
            →
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous breed"
            className="transition-smooth flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-surface text-lg hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
          >
            ←
          </button>

          <div className="flex gap-2">
            {showcaseBreeds.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to ${b.name}`}
                aria-current={i === index}
                className={`transition-smooth h-2.5 rounded-full border border-border ${
                  i === index
                    ? "w-6 bg-primary"
                    : "w-2.5 bg-background-alt hover:bg-secondary"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next breed"
            className="transition-smooth flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-surface text-lg hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
