import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { BREED_GROUPS } from "@/lib/breeds";
import { getBreeds } from "@/lib/getBreeds";
import { BreedSearch } from "@/components/BreedSearch";

export const metadata: Metadata = {
  title: "Dog Breeds — Canine Companion",
  description:
    "Browse every dog breed in the Canine Companion matcher, from the Australian Shepherd to the Yorkshire Terrier, then take the quiz to find your match.",
};

// Standalone route — renders its own Header/Footer chrome (like not-found.tsx),
// not part of AppShell. Header gets no props, so "Start the quiz" falls back to
// /?start=quiz, which AppShell reads on mount (see docs/architecture.md).
export default async function BreedsPage() {
  const breeds = await getBreeds();
  const sortedBreeds = [...breeds].sort((a, b) => a.name.localeCompare(b.name));
  const hasBreeds = sortedBreeds.length > 0;

  // Bucket breeds into groups, in the canonical group order, keeping each
  // group's breeds alphabetical (sortedBreeds already is). Empty groups are
  // dropped. Any breed whose group isn't recognised is collected into a
  // trailing "More breeds" section so it can never silently disappear.
  // BreedSearch renders this grouped view when there's no search query, and
  // falls back to a flat, ranked list of matches once the visitor types.
  const grouped = BREED_GROUPS.map((group) => ({
    group,
    breeds: sortedBreeds.filter((breed) => breed.group === group.value),
  })).filter((section) => section.breeds.length > 0);

  const known = new Set(BREED_GROUPS.map((g) => g.value));
  const ungrouped = sortedBreeds.filter((breed) => !known.has(breed.group));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Meet the <span className="text-link">breeds</span>
            </h1>
            {hasBreeds ? (
              <>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                  Browse all {sortedBreeds.length} breeds our matcher considers,
                  grouped by what they were bred to do — from couch companions
                  to trail-ready athletes. Take the quiz to see which ones fit
                  your life best.
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
            <BreedSearch breeds={sortedBreeds} grouped={grouped} ungrouped={ungrouped} />
          )}
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
