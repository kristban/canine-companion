import { createBreed } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { BreedForm } from "@/components/admin/BreedForm";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

export default function NewBreedPage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="New breed"
        backHref="/admin/breeds"
        backLabel="Breeds"
        description="Add a breed to the catalog. All 12 traits are scored 1–5."
      />
      {isAdminConfigured() ? (
        <BreedForm action={createBreed} breed={null} mode="create" />
      ) : (
        <ConfigNotice />
      )}
    </div>
  );
}
