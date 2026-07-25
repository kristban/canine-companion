import Link from "next/link";
import { countBreeds } from "@/lib/admin/breeds";
import { isAdminConfigured } from "@/lib/admin/http";
import { countSubscribers } from "@/lib/admin/subscribers";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

function CountCard({
  href,
  label,
  emoji,
  count,
}: {
  href: string;
  label: string;
  emoji: string;
  count: number | null;
}) {
  return (
    <Link
      href={href}
      className="transition-smooth flex items-center gap-4 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-secondary/40 text-3xl"
        aria-hidden="true"
      >
        {emoji}
      </span>
      <div>
        <p className="font-display text-2xl font-semibold text-text">
          {count === null ? "—" : count}
        </p>
        <p className="text-sm font-bold text-muted">{label}</p>
      </div>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const configured = isAdminConfigured();

  let breedCount: number | null = null;
  let subscriberCount: number | null = null;
  if (configured) {
    const [breeds, subscribers] = await Promise.all([
      countBreeds(),
      countSubscribers(),
    ]);
    breedCount = breeds.ok ? breeds.data : null;
    subscriberCount = subscribers.ok ? subscribers.data : null;
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Dashboard"
        description="Manage the breed catalog and newsletter subscribers."
      />

      <AdminNotice
        variant="error"
        icon="🔓"
        title="No authentication — this area is unprotected"
      >
        <p>
          Anyone who can reach <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[0.8em]">/admin</code> has full
          read/write/delete access to the database. It is unlinked from the
          public site, but that is not access control. Don&apos;t deploy this to
          a public URL until authentication is added.
        </p>
      </AdminNotice>

      {!configured ? <ConfigNotice /> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <CountCard
          href="/admin/breeds"
          label="Breeds"
          emoji="🐕"
          count={breedCount}
        />
        <CountCard
          href="/admin/newsletter"
          label="Newsletter subscribers"
          emoji="✉️"
          count={subscriberCount}
        />
      </div>
    </div>
  );
}
