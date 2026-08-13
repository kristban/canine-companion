// Browser-side Supabase client for **auth/session only** (anon key). Used by
// Client Components to read the current session and to run OAuth sign-in /
// sign-out. Like the server client, this is scoped to authentication — data
// still loads via the raw-fetch layers, except per-user saved results, which
// go through the user's own session + RLS (see src/lib/results.ts).
//
// @supabase/ssr stores the session in non-httpOnly cookies, so both this client
// and the server client (src/lib/supabase/server.ts) see the same session.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** A singleton browser Supabase client (created lazily on first use). */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
