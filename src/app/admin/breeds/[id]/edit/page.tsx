import { getBreed } from "@/lib/admin/breeds";
import { updateBreed } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { BreedForm } from "@/components/admin/BreedForm";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

export default async function EditBreedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Edit breed" backHref="/admin/breeds" backLabel="Breeds" />
        <ConfigNotice />
      </div>
    );
  }

  const result = await getBreed(id);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Edit breed" backHref="/admin/breeds" backLabel="Breeds" />
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load breed">
          <p>{result.error}</p>
        </AdminNotice>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Breed not found" backHref="/admin/breeds" backLabel="Breeds" />
        <AdminNotice variant="error" icon="🔎" title="Breed not found">
          <p>
            No breed exists with ID{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[0.8em]">
              {id}
            </code>
            .
          </p>
        </AdminNotice>
      </div>
    );
  }

  const breed = result.data;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Edit breed"
        backHref={`/admin/breeds/${breed.id}`}
        backLabel={breed.name}
      />
      <BreedForm
        action={updateBreed.bind(null, breed.id)}
        breed={breed}
        mode="edit"
      />
    </div>
  );
}
