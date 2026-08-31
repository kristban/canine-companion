import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";
import { PROFILES_TABLE, type Profile } from "@/lib/profile";
import { avatarUrlOf } from "@/lib/auth/user";
import { PublicProfileForm } from "@/components/account/PublicProfileForm";
import { AccountForm } from "@/components/account/AccountForm";

export const metadata: Metadata = {
  title: "Account — Canine Companion",
  robots: { index: false, follow: false },
};

// Per-user page: reads the session, so force dynamic.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");

  // RLS scopes this to the caller (profiles select is public, but this reads
  // the row keyed by the signed-in user's own id) — no explicit .eq() needed.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from(PROFILES_TABLE)
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Your <span className="text-link">account</span>
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              Manage your public profile and sign-in email.
            </p>
          </div>

          <PublicProfileForm
            userId={user.id}
            initialProfile={profile ?? null}
            googleAvatarUrl={avatarUrlOf(user)}
          />
          <AccountForm initialEmail={user.email ?? ""} />
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
