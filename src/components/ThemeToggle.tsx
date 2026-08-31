"use client";

import { useEffect, useState } from "react";

// The inline script in layout.tsx sets the `dark` class on <html> before
// paint (reading localStorage, falling back to prefers-color-scheme), so by
// the time this mounts the real theme is already applied — we just read it
// back. `mounted` keeps the first client render identical to the server
// render (which can't know the theme) so hydration doesn't warn.
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage can be unavailable (private browsing); theme just
      // won't persist across reloads.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        mounted
          ? isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
          : "Toggle theme"
      }
      className="transition-smooth flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface text-lg shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span aria-hidden="true">{mounted ? (isDark ? "☀️" : "🌙") : "🌓"}</span>
    </button>
  );
}
