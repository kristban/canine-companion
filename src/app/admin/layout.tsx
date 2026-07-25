import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

// This admin area is deliberately NOT part of the public AppShell and renders
// its own chrome — so it never links itself into the public Header/Footer nav.
// `noindex` keeps it out of search results as a belt-and-suspenders measure;
// note it is NOT access control (there is no auth yet — see the dashboard).
export const metadata: Metadata = {
  title: "Admin — Canine Companion",
  robots: { index: false, follow: false },
};

// An admin console must always reflect live database state, never a build-time
// static snapshot. This segment config applies to every route under /admin.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
          <AdminNav />
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
            className="transition-smooth font-bold hover:text-primary"
          >
            View public site ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
