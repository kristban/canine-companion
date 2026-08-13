"use client";

// The mobile equivalent of Header's primary <nav> (Breeds, Paws & Pointers,
// Newsletter), which is hidden below the `sm` breakpoint with no replacement —
// on mobile those links were previously unreachable. This renders a hamburger
// toggle (visible only below `sm`) that opens a dropdown panel with the same
// links, mirroring AuthNav's dropdown interaction (outside-click / Escape to
// close, closes on navigation) for consistency.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "/breeds", label: "Breeds" },
  { href: "/guides", label: "Paws & Pointers" },
  { href: "#signup-heading", label: "Newsletter" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative sm:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="transition-smooth flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-surface shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="relative flex h-4 w-5 flex-col justify-between" aria-hidden="true">
          <span
            className={`block h-0.5 w-full rounded-full bg-text transition-smooth ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-full rounded-full bg-text transition-smooth ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-full rounded-full bg-text transition-smooth ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open ? (
        <nav
          aria-label="Primary"
          role="menu"
          className="absolute left-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border-3 border-border bg-surface shadow-hard"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              role="menuitem"
              href={link.href}
              onClick={() => setOpen(false)}
              className="transition-smooth block px-4 py-3 text-sm font-bold text-text hover:bg-background"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
