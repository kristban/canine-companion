import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { signOut } from "@/lib/auth/actions";

// Layout for every protected admin route. `requireAdmin()` is the authoritative
// gate here: it redirects to /admin/login unless the caller is signed in with
// an allowlisted Google account. Because this layout wraps only the (protected)
// group — not the sibling /admin/login route — the guard can redirect without
// looping. This is the single choke point for admin *page* access; the proxy
// (src/proxy.ts) is the optimistic pre-filter and each Server Action re-checks.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b-3 border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-secondary text-lg"
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <AdminNav />
            <div className="flex items-center gap-3 md:border-l-2 md:border-border/30 md:pl-4">
              <span
                className="max-w-[12rem] truncate text-sm font-bold text-muted"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="transition-smooth rounded-full border-2 border-border bg-surface px-4 py-2 text-sm font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          {children}
        </div>
      </main>

      <footer className="border-t-3 border-border bg-background-alt">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted sm:px-6">
          <span>Admin console</span>
          <Link
            href="/"
            className="transition-smooth font-bold hover:text-link"
          >
            View public site ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
