"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "canine-companion-cookie-consent";

const emptySubscribe = () => () => {};

/** True once the component has hydrated on the client; false during SSR. */
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function CookieConsent() {
  const hasMounted = useHasMounted();
  const [dismissed, setDismissed] = useState(false);

  const hasStoredConsent = hasMounted
    ? Boolean(window.localStorage.getItem(STORAGE_KEY))
    : true;
  const visible = hasMounted && !dismissed && !hasStoredConsent;

  function respond(choice: "accepted" | "declined") {
    window.localStorage.setItem(STORAGE_KEY, choice);
    setDismissed(true);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      aria-hidden={!visible}
      inert={!visible}
      className={`transition-smooth fixed inset-x-0 bottom-0 z-20 border-t-3 border-border bg-surface px-4 py-5 sm:px-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center text-sm leading-relaxed text-muted sm:text-left">
          We use cookies to remember your preferences and improve your
          experience. By clicking &ldquo;Accept&rdquo;, you consent to our use
          of cookies in line with GDPR. See our{" "}
          <Link
            href="/cookies"
            className="font-semibold text-primary underline underline-offset-2 hover:text-secondary"
          >
            Cookie Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => respond("declined")}
            className="transition-smooth rounded-full border-2 border-border bg-surface px-5 py-2.5 text-sm font-bold text-text hover:-translate-y-0.5 hover:shadow-hard-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="transition-smooth rounded-full border-2 border-border bg-primary px-5 py-2.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:shadow-hard-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
