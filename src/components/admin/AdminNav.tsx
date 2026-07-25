"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/breeds", label: "Breeds", exact: false },
  { href: "/admin/newsletter", label: "Newsletter", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap items-center gap-2">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`transition-smooth rounded-full border-2 px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? "border-border bg-primary text-white shadow-hard-sm"
                : "border-transparent text-text hover:border-border hover:bg-surface"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
