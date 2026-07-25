import { getBreed } from "@/lib/admin/breeds";
import { deleteBreed } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { TRAIT_FIELDS } from "@/lib/admin/types";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AdminPageHeading, ButtonLink, ConfigNotice } from "@/components/admin/ui";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default async function BreedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Breed" backHref="/admin/breeds" backLabel="Breeds" />
        <ConfigNotice />
      </div>
    );
  }

  const result = await getBreed(id);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading title="Breed" backHref="/admin/breeds" backLabel="Breeds" />
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load breed">
          <p>{result.error}</p>
        </AdminNotice>
      </div>
    );
  }

  const breed = result.data;

  if (!breed) {
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

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden="true">{breed.emoji}</span>
            {breed.name}
          </span>
        }
        backHref="/admin/breeds"
        backLabel="Breeds"
        description={breed.tagline}
        action={
          <ButtonLink href={`/admin/breeds/${breed.id}/edit`}>Edit</ButtonLink>
        }
      />

      <div className="flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-text">{breed.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Size
            </dt>
            <dd className="mt-1 capitalize text-text">{breed.size}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Description
            </dt>
            <dd className="mt-1 leading-relaxed text-text">
              {breed.description}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Created
            </dt>
            <dd className="mt-1 text-sm text-muted">
              {formatDate(breed.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Updated
            </dt>
            <dd className="mt-1 text-sm text-muted">
              {formatDate(breed.updatedAt)}
            </dd>
          </div>
        </dl>

        <div>
          <h2 className="font-display text-lg font-semibold text-text">
            Traits
          </h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {TRAIT_FIELDS.map(({ key, label, icon }) => {
              const value = breed[key];
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <dt className="flex w-40 shrink-0 items-center gap-1.5 font-semibold text-text">
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </dt>
                  <dd
                    className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-border bg-background-alt"
                    role="img"
                    aria-label={`${label}: ${value} out of 5`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </dd>
                  <span className="w-4 shrink-0 text-right font-bold text-muted">
                    {value}
                  </span>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      <div className="rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <h2 className="font-display text-lg font-semibold text-text">
          Danger zone
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Permanently remove this breed from the catalog.
        </p>
        <DeleteButton
          action={deleteBreed}
          id={breed.id}
          itemLabel={breed.name}
        />
      </div>
    </div>
  );
}
