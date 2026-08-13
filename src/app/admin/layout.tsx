import type { Metadata } from "next";
import type { ReactNode } from "react";

// Thin root layout shared by BOTH the login page and the protected admin area.
// It deliberately carries no auth check and no nav chrome — the auth gate and
// the signed-in chrome live in the (protected) route group's layout, so the
// login page (a sibling, outside that group) can render without triggering the
// redirect-to-login guard (which would otherwise loop).
//
// `noindex` keeps the whole area out of search results as a belt-and-suspenders
// measure; the real access control is now the Google sign-in gate (src/proxy.ts
// + the (protected) layout + per-action requireAdmin checks).
export const metadata: Metadata = {
  title: "Admin — Canine Companion",
  robots: { index: false, follow: false },
};

// An admin console must always reflect live database + session state, never a
// build-time static snapshot. Applies to every route under /admin.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
