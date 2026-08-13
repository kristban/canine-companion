// Small pure helpers for reading identity off a Supabase User. Safe to import
// from both Client and Server Components (no side effects, no env reads).

import type { User } from "@supabase/supabase-js";

/**
 * The name to show for a user: the display name they set, else the name Google
 * provided, else the local part of their email, else a generic fallback.
 */
export function displayNameOf(user: User | null | undefined): string {
  if (!user) return "Account";
  const meta = user.user_metadata ?? {};
  const candidate =
    (meta.display_name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined);
  if (candidate && candidate.trim()) return candidate.trim();
  if (user.email) return user.email.split("@")[0];
  return "Account";
}

/** First letter to show in an avatar chip. */
export function avatarInitialOf(user: User | null | undefined): string {
  return displayNameOf(user).charAt(0).toUpperCase() || "?";
}
