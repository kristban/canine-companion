"use client";

// The login/logout control in the main nav. Reflects live auth state via
// useSession(). Signed out → "Continue with Google". Signed in → a name chip
// that opens a small menu (My results, Account, Log out). Sign-in/out run
// through the browser Supabase client; the OAuth round-trip returns to
// /auth/callback and then back to wherever the user was.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useSession } from "./SessionProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { avatarInitialOf, avatarUrlOf, displayNameOf } from "@/lib/auth/user";
import { isAdminEmail } from "@/lib/auth/checkAdmin";

/** The user's Google profile picture, or an initial-letter chip if none. */
function UserAvatar({ user, size }: { user: User; size: number }) {
  const avatarUrl = avatarUrlOf(user);
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border-2 border-border object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary text-sm"
      aria-hidden="true"
    >
      {avatarInitialOf(user)}
    </span>
  );
}

export function AuthNav() {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ask the server whether this account is on the admin allowlist — the
  // allowlist itself (ADMIN_ALLOWED_EMAILS) never reaches the browser, only
  // this yes/no answer for the signed-in user's own email. No reset-to-false
  // branch for the signed-out case: the menu (where isAdmin is read) only
  // renders at all when `user` is truthy, so a stale value is inert, and
  // sign-out already does a full page reload that clears all state anyway.
  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    isAdminEmail(user.email).then((allowed) => {
      if (active) setIsAdmin(allowed);
    });
    return () => {
      active = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signIn() {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const next = pathname && pathname.startsWith("/") ? pathname : "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // On success the browser is already navigating to Google; only reached on error.
    if (error) setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    // Full reload so server components re-render in the signed-out state.
    window.location.assign("/");
  }

  // Reserve space while the first session check resolves (avoids layout shift).
  if (loading) {
    return <span className="inline-block h-10 w-24" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="transition-smooth inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-2.5 text-sm font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span aria-hidden="true">🔑</span>
        <span className="hidden sm:inline">Continue with Google</span>
        <span className="sm:hidden">Log in</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="transition-smooth inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface py-1.5 pl-1.5 pr-3 text-sm font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <UserAvatar user={user} size={28} />
        <span className="hidden max-w-[10rem] truncate sm:inline">
          {displayNameOf(user)}
        </span>
        <span aria-hidden="true" className="text-xs">
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border-3 border-border bg-surface shadow-hard"
        >
          <div className="flex items-center gap-3 border-b-2 border-border/40 px-4 py-3">
            <UserAvatar user={user} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text">
                {displayNameOf(user)}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <Link
            role="menuitem"
            href="/results"
            onClick={() => setOpen(false)}
            className="transition-smooth block px-4 py-2.5 text-sm font-bold text-text hover:bg-background"
          >
            My results
          </Link>
          <Link
            role="menuitem"
            href="/account"
            onClick={() => setOpen(false)}
            className="transition-smooth block px-4 py-2.5 text-sm font-bold text-text hover:bg-background"
          >
            Account
          </Link>
          {isAdmin ? (
            <Link
              role="menuitem"
              href="/admin"
              onClick={() => setOpen(false)}
              className="transition-smooth block px-4 py-2.5 text-sm font-bold text-text hover:bg-background"
            >
              Admin
            </Link>
          ) : null}
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            disabled={busy}
            className="transition-smooth block w-full px-4 py-2.5 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-70"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
