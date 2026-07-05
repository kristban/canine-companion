"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      suppressHydrationWarning
      className="transition-smooth flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-lg hover:scale-105 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
