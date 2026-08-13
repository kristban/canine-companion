"use server";

// Auth Server Actions used by the login page and the admin header. Both are
// plain <form action={...}> handlers (no Client Component needed): sign-in runs
// the OAuth flow entirely server-side and redirects the browser to Google;
// sign-out clears the session cookies and returns to the login page.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** The public origin of the current request (honours proxy/forwarding headers). */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/** Sanitise a post-login target to an internal path (prevents open redirects). */
function safeInternalPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/admin";
}

/**
 * Start Google sign-in. Builds the provider authorization URL server-side
 * (which also sets the PKCE verifier cookie) and redirects to it. Google
 * returns to Supabase, which returns to our /auth/callback route.
 */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeInternalPath(formData.get("redirectTo"));
  const origin = await requestOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(
      `/admin/login?error=oauth_init&redirectTo=${encodeURIComponent(next)}`,
    );
  }

  redirect(data.url);
}

/** Sign out and return to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
