import { getSubscriber } from "@/lib/admin/subscribers";
import { updateSubscriber } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { SubscriberForm } from "@/components/admin/SubscriberForm";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

export default async function EditSubscriberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Edit subscriber" backHref="/admin/newsletter" backLabel="Newsletter" />
        <ConfigNotice />
      </div>
    );
  }

  const result = await getSubscriber(id);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Edit subscriber" backHref="/admin/newsletter" backLabel="Newsletter" />
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load subscriber">
          <p>{result.error}</p>
        </AdminNotice>
      </div>
    );
  }

  if (!result.data) {
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

  const subscriber = result.data;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Edit subscriber"
        backHref={`/admin/newsletter/${subscriber.id}`}
        backLabel={subscriber.name}
      />
      <SubscriberForm
        action={updateSubscriber.bind(null, subscriber.id)}
        subscriber={subscriber}
        mode="edit"
      />
    </div>
  );
}
