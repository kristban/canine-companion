import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { createClient } from "@/lib/supabase/server";
import { PROFILES_TABLE, type Profile } from "@/lib/profile";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

// Public read via the anon key + RLS (profiles select is open to everyone —
// see docs/data-model.md) — no session required, so this works for
// signed-out visitors too. `username` is citext, so the lookup is already
// case-insensitive at the database level.
async function fetchProfile(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(PROFILES_TABLE)
    .select("*")
    .eq("username", username)
    .maybeSingle<Profile>();
  return data;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchProfile(username);
  if (!profile) {
    return {
      title: "Profile Not Found — Canine Companion",
      robots: { index: false, follow: false },
    };
  }
  const name = profile.display_name || `@${profile.username}`;
  return {
    title: `${name} — Canine Companion`,
    description: profile.bio || `${name}'s profile on Canine Companion.`,
    alternates: { canonical: `/u/${profile.username}` },
  };
}

// Standalone route — renders its own Header/Footer chrome (like /breeds and
// /breeds/[slug]), not part of AppShell. Header gets no props, so "Start the
// quiz" falls back to /?start=quiz, which AppShell reads on mount (see
// docs/architecture.md). Read-only: this is the public *viewing* page, not
// the owner's own edit view (that's /account).
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await fetchProfile(username);
  if (!profile) notFound();

  const name = profile.display_name || `@${profile.username}`;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-6 rounded-3xl border-3 border-border bg-surface p-8 text-center shadow-hard">
            {profile.avatar_url ? (
              // Arbitrary user-supplied URL — not run through next/image,
              // which only allows a fixed set of remote hosts (see
              // next.config.ts, scoped to Google's avatar CDN).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded-full border-2 border-border object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary text-4xl font-bold text-text"
              >
                {initial}
              </span>
            )}

            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                {name}
              </h1>
              <p className="mt-1 text-muted">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="max-w-md text-base leading-relaxed text-text">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
