import { createSubscriber } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { SubscriberForm } from "@/components/admin/SubscriberForm";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

export default function NewSubscriberPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Add subscriber"
        backHref="/admin/newsletter"
        backLabel="Newsletter"
        description="Manually add someone to the newsletter list."
      />
      {isAdminConfigured() ? (
        <SubscriberForm
          action={createSubscriber}
          subscriber={null}
          mode="create"
        />
      ) : (
        <ConfigNotice />
      )}
    </div>
  );
}
