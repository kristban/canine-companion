// OAuth callback: Supabase redirects here (with a one-time `code`) after Google
// sign-in — for BOTH public visitors and admins. It just exchanges the code for
// a session and redirects to `next`.
//
// It does NOT enforce the admin allowlist: ordinary users must be allowed to
// hold a session, and admin access is gated separately (src/proxy.ts +
// requireAdmin() + the (protected) layout). A non-allowlisted user who signs in
// via /admin/login lands on /admin and is bounced to /admin/login?error=not_allowed
// by the proxy.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isEmailAllowed } from "@/lib/auth/allowlist";
import { syncUserRole } from "@/lib/auth/role";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/";

  const loginWithError = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  if (!code) return loginWithError("missing_code");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return loginWithError("not_configured");

  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return loginWithError("auth_failed");

  // Re-sync the DB-backed role reflection on every sign-in (see
  // src/lib/auth/role.ts) — covers both the admin and public login flows,
  // and re-derives correctly if the allowlist has changed since last time.
  // getUser() revalidates the JWT rather than trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await syncUserRole(user.id, isEmailAllowed(user.email) ? "admin" : "user");
  }

  return response;
}
