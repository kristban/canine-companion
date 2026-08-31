import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNotice } from "./AdminNotice";

const BUTTON_BASE =
  "transition-smooth inline-flex items-center gap-1.5 rounded-full border-2 border-border px-5 py-2.5 text-sm font-bold shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}

/** A `<Link>` styled as a pressable pill button, matching the design system. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  const variantClass =
    variant === "primary"
      ? "bg-primary text-white"
      : "bg-surface text-text";
  return (
    <Link href={href} className={`${BUTTON_BASE} ${variantClass}`}>
      {children}
    </Link>
  );
}

interface AdminPageHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}

export function AdminPageHeading({
  title,
  description,
  backHref,
  backLabel = "Back",
  action,
}: AdminPageHeadingProps) {
  return (
    <div className="mb-8">
      {backHref ? (
        <Link
          href={backHref}
          className="transition-smooth text-sm font-bold text-muted hover:text-link"
        >
          ← {backLabel}
        </Link>
      ) : null}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

/** Shown when the service-role key / Supabase URL isn't configured. */
export function ConfigNotice() {
  return (
    <AdminNotice
      variant="warning"
      icon="🔌"
      title="Admin isn't connected to Supabase yet"
    >
      <p>
        Set <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.8em]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        (and{" "}
        <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.8em]">NEXT_PUBLIC_SUPABASE_URL</code>) in{" "}
        <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.8em]">.env.local</code>, then restart the dev
        server. Find the key in Supabase → Project Settings → API → Project API
        keys → <strong>service_role</strong>. It bypasses row-level security, so
        keep it server-side only — never commit it or expose it to the browser.
      </p>
    </AdminNotice>
  );
}
