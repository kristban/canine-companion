// Authoritative admin auth check (the DAL). Everything that must be protected
// calls through here rather than re-implementing the check.
//
// `getAdminUser()` verifies the session with the Supabase Auth server via
// getUser() (which revalidates the JWT — unlike getSession(), which trusts the
// cookie unverified) and confirms the email is on the allowlist. It is wrapped
// in React `cache()` so repeated calls within one request hit Supabase once.
//
// `requireAdmin()` is the redirect-on-failure variant used by protected routes
// and by every admin Server Action (a Server Action POST is not reliably
// covered by the proxy, so the in-action check is mandatory, not optional).

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSessionUser } from "./requireUser";
import { isEmailAllowed } from "./allowlist";

/** The signed-in, allowlisted admin user — or null if neither holds. */
export async function getAdminUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user || !isEmailAllowed(user.email)) return null;
  return user;
}

/**
 * Require an allowlisted admin. Redirects to the login page when the caller
 * isn't signed in as an allowlisted user; otherwise returns the user.
 * Call this OUTSIDE any try/catch — its redirect() throws NEXT_REDIRECT.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
