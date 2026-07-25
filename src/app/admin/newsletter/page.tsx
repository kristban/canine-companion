import Link from "next/link";
import { listSubscribers } from "@/lib/admin/subscribers";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
import {
  AdminPageHeading,
  ButtonLink,
  ConfigNotice,
} from "@/components/admin/ui";

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { dateStyle: "medium" });
}

export default async function NewsletterListPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Newsletter" backHref="/admin" backLabel="Dashboard" />
        <ConfigNotice />
      </div>
    );
  }

  const result = await listSubscribers();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Newsletter"
        backHref="/admin"
        backLabel="Dashboard"
        description="People who signed up through the site's newsletter form."
        action={
          <ButtonLink href="/admin/newsletter/new">+ Add subscriber</ButtonLink>
        }
      />

      {!result.ok ? (
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load subscribers">
          <p>{result.error}</p>
        </AdminNotice>
      ) : result.data.length === 0 ? (
        <AdminNotice icon="✉️" title="No subscribers yet">
          <p>Signups from the newsletter form will appear here.</p>
        </AdminNotice>
      ) : (
        <div className="overflow-x-auto rounded-3xl border-3 border-border bg-surface shadow-hard">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-background-alt">
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  Name
                </th>
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  Email
                </th>
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  Status
                </th>
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  Joined
                </th>
                <th className="px-5 py-3 text-right font-extrabold uppercase tracking-wide text-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((subscriber) => (
                <tr
                  key={subscriber.id}
                  className="border-b-2 border-border/15 last:border-b-0"
                >
                  <td className="px-5 py-3 font-bold text-text">
                    {subscriber.name}
                  </td>
                  <td className="px-5 py-3 text-muted">{subscriber.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border-2 border-border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ${
                        subscriber.status === "subscribed"
                          ? "bg-accent/40 text-text"
                          : "bg-background-alt text-muted"
                      }`}
                    >
                      {subscriber.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {formatDate(subscriber.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3 font-bold">
                      <Link
                        href={`/admin/newsletter/${subscriber.id}`}
                        className="transition-smooth text-primary hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/newsletter/${subscriber.id}/edit`}
                        className="transition-smooth text-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
