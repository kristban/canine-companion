import { listSubscribers } from "@/lib/admin/subscribers";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { SubscribersTable } from "@/components/admin/SubscribersTable";
import {
  AdminPageHeading,
  ButtonLink,
  ConfigNotice,
} from "@/components/admin/ui";

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
        <SubscribersTable subscribers={result.data} />
      )}
    </div>
  );
}
