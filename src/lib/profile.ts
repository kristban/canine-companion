// Types + constants for the public `profiles` table (see docs/data-model.md
// and supabase/schema.sql). Accessed with the user's own session (RLS), never
// service-role.

export const PROFILES_TABLE = "profiles";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/** Row shape of `public.profiles` — public identity, readable by anyone. */
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}
