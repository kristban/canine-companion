import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Breed } from "@/lib/breeds";
import { getBreeds } from "@/lib/getBreeds";

export const metadata: Metadata = {
  title: "Dog Breeds — Canine Companion",
  description:
    "Browse every dog breed in the Canine Companion matcher, from the Australian Shepherd to the Yorkshire Terrier, then take the quiz to find your match.",
};

// A few at-a-glance traits per card, mirroring the bars in BreedShowcase.
const TRAIT_BARS: { key: keyof Breed; label: string; icon: string }[] = [
  { key: "energy", label: "Energy", icon: "⚡" },
  { key: "grooming", label: "Grooming", icon: "✂️" },
  { key: "trainability", label: "Trainability", icon: "🎓" },
];

// Standalone route — renders its own Header/Footer chrome (like not-found.tsx),
// not part of AppShell. Header gets no props, so "Start the quiz" falls back to
// /?start=quiz, which AppShell reads on mount (see docs/architecture.md).
export default async function BreedsPage() {
  const breeds = await getBreeds();
  const sortedBreeds = [...breeds].sort((a, b) => a.name.localeCompare(b.name));
  const hasBreeds = sortedBreeds.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Meet the <span className="text-primary">breeds</span>
            </h1>
            {hasBreeds ? (
              <>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                  Browse all {sortedBreeds.length} breeds our matcher considers
                  — from couch companions to trail-ready athletes. Take the quiz
                  to see which ones fit your life best.
                </p>
                <Link
                  href="/?start=quiz"
                  className="transition-smooth mt-8 inline-block rounded-full border-2 border-border bg-primary px-8 py-4 text-lg font-bold text-white shadow-hard hover:-translate-y-1 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Find your match 🐾
                </Link>
              </>
            ) : (
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                We couldn&apos;t load the breeds right now. Please check back
                soon.
              </p>
            )}
          </div>

          {hasBreeds && (
            <ul className="mt-14 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedBreeds.map((breed) => (
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
          )}
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
