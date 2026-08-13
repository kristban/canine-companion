// The admin email allowlist — the single source of truth for *who* may reach
// the /admin area once signed in with Google.
//
// Configured via the ADMIN_ALLOWED_EMAILS env var (comma-separated, no
// NEXT_PUBLIC_ prefix — it never needs to reach the browser). This is
// deliberately env-based, matching how the service-role key is configured;
// changing who has access is an env edit + redeploy.
//
// Pure module (no server-only imports) so it is safe to use from the proxy
// (Node runtime), Route Handlers, Server Components, and Server Actions alike.

/** Parsed, lower-cased list of allowed admin emails (may be empty). */
export function getAllowedEmails(): string[] {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether `email` is on the allowlist. **Fails closed**: an empty/unset
 * allowlist allows no one, and a missing email is never allowed. Comparison is
 * case-insensitive.
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}
