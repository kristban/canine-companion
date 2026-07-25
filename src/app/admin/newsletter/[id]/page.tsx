import { getSubscriber } from "@/lib/admin/subscribers";
import { deleteSubscriber } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPageHeading, ButtonLink, ConfigNotice } from "@/components/admin/ui";

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function SubscriberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Subscriber" backHref="/admin/newsletter" backLabel="Newsletter" />
        <ConfigNotice />
      </div>
    );
  }

  const result = await getSubscriber(id);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Subscriber" backHref="/admin/newsletter" backLabel="Newsletter" />
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load subscriber">
          <p>{result.error}</p>
        </AdminNotice>
      </div>
    );
  }

  const subscriber = result.data;

  if (!subscriber) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Subscriber not found" backHref="/admin/newsletter" backLabel="Newsletter" />
        <AdminNotice variant="error" icon="🔎" title="Subscriber not found">
          <p>
            No subscriber exists with ID{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[0.8em]">
              {id}
            </code>
            .
          </p>
        </AdminNotice>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title={subscriber.name}
        backHref="/admin/newsletter"
        backLabel="Newsletter"
        description={subscriber.email}
        action={
          <ButtonLink href={`/admin/newsletter/${subscriber.id}/edit`}>
            Edit
          </ButtonLink>
        }
      />

      <div className="rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Name
            </dt>
            <dd className="mt-1 text-text">{subscriber.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Email
            </dt>
            <dd className="mt-1 text-text">{subscriber.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Status
            </dt>
            <dd className="mt-1 capitalize text-text">{subscriber.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Joined
            </dt>
            <dd className="mt-1 text-muted">
              {formatDate(subscriber.createdAt)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-muted">
              {subscriber.id}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <h2 className="font-display text-lg font-semibold text-text">
          Danger zone
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Permanently remove this subscriber.
        </p>
        <DeleteButton
          action={deleteSubscriber}
          id={subscriber.id}
          itemLabel={subscriber.email}
        />
      </div>
    </div>
  );
}
