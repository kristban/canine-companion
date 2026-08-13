// Server-side Supabase client for **auth/session only** (anon key).
//
// This is the one place the project uses @supabase/supabase-js / @supabase/ssr
// instead of raw fetch: OAuth (PKCE) + cookie-session handling is exactly the
// "don't hand-roll security" case. It is scoped to authentication — the breed
// and newsletter data layers (getBreeds, newsletter, admin/http) stay on raw
// fetch. This client uses the public **anon** key, never the service-role key.
//
// Server-only: it reads cookies via next/headers. Use it from Server
// Components, Route Handlers, and Server Actions — never a Client Component.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once the Supabase URL + anon key needed for auth are present. */
export function isAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Build a request-scoped Supabase auth client wired to the Next.js cookie
 * store. `setAll` is wrapped in try/catch because `cookies().set` throws during
 * a Server Component render (cookies can't be written after streaming starts) —
 * in that context the client is read-only and the proxy refreshes the session.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render — ignore; the proxy
          // (src/proxy.ts) writes refreshed session cookies instead.
        }
      },
    },
  });
}
