import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/requireUser";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

// Public sign-in page. The redirect target for requireUser() when a signed-out
// visitor deep-links into a per-user page (/account, /results). Everyday sign-in
// happens straight from the nav; this page is the fallback landing spot.

// Utility page, not content — noindex like /account and /results.
export const metadata: Metadata = {
  title: "Sign in — Canine Companion",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Sign-in couldn't be completed. Please try again.",
  missing_code: "Sign-in was interrupted. Please try again.",
  not_configured: "Sign-in isn't configured on the server yet.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectTo =
    typeof params.redirectTo === "string" && params.redirectTo.startsWith("/")
      ? params.redirectTo
      : "/";
  const errorKey = typeof params.error === "string" ? params.error : null;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] : null;

  // Already signed in → skip the page.
  if (await getSessionUser()) redirect(redirectTo);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-grid-pattern px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border-3 border-border bg-surface p-8 shadow-hard sm:p-10">
        <Link
          href="/"
          className="transition-smooth mb-6 inline-flex items-center gap-2.5"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-secondary text-xl"
            aria-hidden="true"
          >
            🐾
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-text">
            Canine Companion
          </span>
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
          Sign in
        </h1>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Sign in with Google to save your quiz results and manage your account.
          You can always take the quiz without an account.
        </p>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-6 rounded-2xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton redirectTo={redirectTo} />
        </div>

        <Link
          href="/"
          className="transition-smooth mt-6 block text-center text-sm font-bold text-muted hover:text-link"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
