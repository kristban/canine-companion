import { listBreeds } from "@/lib/admin/breeds";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { BreedsTable } from "@/components/admin/BreedsTable";
import {
  AdminPageHeading,
  ButtonLink,
  ConfigNotice,
} from "@/components/admin/ui";

export default async function BreedsListPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Breeds" backHref="/admin" backLabel="Dashboard" />
        <ConfigNotice />
      </div>
    );
  }

  const result = await listBreeds();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Breeds"
        backHref="/admin"
        backLabel="Dashboard"
        description="The catalog powering the matcher and the public breeds gallery."
        action={<ButtonLink href="/admin/breeds/new">+ New breed</ButtonLink>}
      />

      {!result.ok ? (
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load breeds">
          <p>{result.error}</p>
        </AdminNotice>
      ) : result.data.length === 0 ? (
        <AdminNotice icon="🐾" title="No breeds yet">
          <p>
            Add the first breed with the “New breed” button above.
          </p>
        </AdminNotice>
      ) : (
        <BreedsTable breeds={result.data} />
      )}
    </div>
  );
}
