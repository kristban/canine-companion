import { AdminNotice } from "@/components/admin/AdminNotice";
import { isAuthConfigured } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/lib/auth/actions";

// Login page for the admin area. Lives OUTSIDE the (protected) route group, so
// it isn't caught by that layout's requireAdmin() redirect. The proxy already
// sends signed-in admins here straight to /admin, so this page is normally seen
// only when signed out or rejected.

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed:
    "That Google account isn't on the admin allowlist. Sign in with an authorized account.",
  auth_failed: "Sign-in couldn't be completed. Please try again.",
  missing_code: "Sign-in was interrupted. Please try again.",
  oauth_init: "Couldn't start Google sign-in. Please try again.",
  not_configured:
    "Authentication isn't configured on the server yet. Set the Supabase env vars and enable the Google provider.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectTo =
    typeof params.redirectTo === "string" ? params.redirectTo : "/admin";
  const errorKey = typeof params.error === "string" ? params.error : null;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] : null;
  const configured = isAuthConfigured();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-grid-pattern px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border-3 border-border bg-surface p-8 shadow-hard sm:p-10">
        <div className="mb-6 flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-secondary text-xl"
            aria-hidden="true"
          >
            🐾
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-text">
            Canine Companion
          </span>
          <span className="rounded-full border-2 border-border bg-primary px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-white">
            Admin
          </span>
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
          Sign in
        </h1>
        <p className="mt-2 text-base leading-relaxed text-muted">
          The admin console is restricted to authorized accounts. Sign in with
          Google to continue.
        </p>

        {errorMessage ? (
          <div className="mt-6">
            <AdminNotice variant="error" icon="⚠️" title="Couldn't sign you in">
              <p>{errorMessage}</p>
            </AdminNotice>
          </div>
        ) : null}

        {!configured ? (
          <div className="mt-6">
            <AdminNotice
              variant="warning"
              icon="🔌"
              title="Authentication isn't configured"
            >
              <p>
                Set{" "}
                <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.8em]">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                and{" "}
                <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.8em]">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>
                , enable the Google provider in Supabase, and set{" "}
                <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.8em]">
                  ADMIN_ALLOWED_EMAILS
                </code>
                .
              </p>
            </AdminNotice>
          </div>
        ) : null}

        <form action={signInWithGoogle} className="mt-8">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            disabled={!configured}
            className="transition-smooth flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-border bg-primary px-6 py-3.5 text-base font-bold text-white shadow-hard hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <span aria-hidden="true">🔑</span>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
