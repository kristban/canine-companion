// Server-side "is anyone signed in?" check — the public counterpart to
// requireAdmin (which layers an email allowlist on top of this). Used to gate
// the per-user pages (/account, /results).
//
// getSessionUser() verifies the JWT with Supabase via getUser() (not the
// unverified getSession()) and is cache()-wrapped so repeated calls in one
// request hit Supabase once.

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, isAuthConfigured } from "@/lib/supabase/server";

/** The signed-in user, or null. No allowlist — any authenticated user. */
export const getSessionUser = cache(async (): Promise<User | null> => {
  if (!isAuthConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
});

/**
 * Require any signed-in user; redirect to the public login (preserving where
 * they were headed) if none. Call OUTSIDE try/catch — redirect() throws.
 */
export async function requireUser(redirectTo = "/"): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}
