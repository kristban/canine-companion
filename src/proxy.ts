// Auth gate for /admin — Next.js 16 "proxy" (the renamed middleware convention;
// `middleware.ts` no longer exists in Next 16, and this runs on the Node.js
// runtime). It refreshes the Supabase session cookie on every /admin request
// and redirects anyone who isn't a signed-in, allowlisted admin to the login
// page.
//
// This is the route-level gate for page navigations. It is NOT the whole story:
// a matcher exclusion also skips the proxy for Server Action POSTs, so every
// admin Server Action re-checks auth via requireAdmin(), and the (protected)
// layout re-checks on render. See docs/architecture.md.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isEmailAllowed } from "@/lib/auth/allowlist";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/admin/login";

  // A NextResponse we can hang refreshed session cookies on as we go.
  let response = NextResponse.next({ request });

  let email: string | null | undefined = null;
  let signedIn = false;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // getUser() revalidates the JWT and refreshes the session cookie.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email;
    signedIn = Boolean(user);
  }

  const allowed = isEmailAllowed(email);

  // Unauthenticated/non-allowlisted → bounce to login (except the login page).
  if (!allowed && !isLoginRoute) {
    const loginUrl = new URL("/admin/login", request.url);
    if (signedIn) {
      // Signed in with a real account, just not on the allowlist.
      loginUrl.searchParams.set("error", "not_allowed");
    } else {
      loginUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Already an admin but sitting on the login page → send to the dashboard.
  if (allowed && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  // Runs for every /admin route (including /admin itself). The OAuth callback
  // (/auth/callback) is intentionally outside this scope — it manages its own
  // cookies while exchanging the code for a session.
  matcher: ["/admin/:path*"],
};
