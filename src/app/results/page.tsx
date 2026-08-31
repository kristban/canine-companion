import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { SAVED_RESULTS_TABLE, type SavedResultRow } from "@/lib/results";
import { SavedResultsList } from "@/components/results/SavedResultsList";

export const metadata: Metadata = {
  title: "My results — Canine Companion",
  robots: { index: false, follow: false },
};

// Per-user page: force dynamic (reads the session) and never cache.
export const dynamic = "force-dynamic";

export default async function MyResultsPage() {
  // Signed-out visitors are redirected to /login?redirectTo=/results.
  await requireUser("/results");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(SAVED_RESULTS_TABLE)
    .select("id, created_at, title, results, answers")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as SavedResultRow[];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              My <span className="text-link">results</span>
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
              Quiz results you&apos;ve saved to your account.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border-2 border-red-500 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 shadow-hard-sm">
              We couldn&apos;t load your saved results right now. Please try again
              in a moment.
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border-3 border-border bg-surface p-8 text-center shadow-hard">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-secondary/40 text-3xl"
                aria-hidden="true"
              >
                🐾
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-text">
                No saved results yet
              </p>
              <p className="mt-2 text-muted">
                Take the quiz, then hit “Save these results” to keep them here.
              </p>
              <Link
                href="/?start=quiz"
                className="transition-smooth mt-6 inline-block rounded-full border-2 border-border bg-primary px-8 py-3 text-base font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Take the quiz 🐾
              </Link>
            </div>
          ) : (
            <SavedResultsList initialRows={rows} />
          )}
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
