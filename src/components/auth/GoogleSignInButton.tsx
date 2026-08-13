"use client";

// A "Continue with Google" button for full pages (the public /login page).
// Runs OAuth through the browser client; the round-trip returns to
// /auth/callback and then to `redirectTo`.

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface GoogleSignInButtonProps {
  /** Internal path to return to after sign-in (default "/"). */
  redirectTo?: string;
  label?: string;
}

export function GoogleSignInButton({
  redirectTo = "/",
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const next = redirectTo.startsWith("/") ? redirectTo : "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={busy}
      className="transition-smooth flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-border bg-primary px-6 py-3.5 text-base font-bold text-white shadow-hard hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      <span aria-hidden="true">🔑</span>
      {busy ? "Redirecting…" : label}
    </button>
  );
}
