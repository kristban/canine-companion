import Link from "next/link";
import { listBreeds } from "@/lib/admin/breeds";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
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
        <div className="overflow-x-auto rounded-3xl border-3 border-border bg-surface shadow-hard">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-background-alt">
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  Breed
                </th>
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  ID
                </th>
                <th className="px-5 py-3 font-extrabold uppercase tracking-wide text-text">
                  Size
                </th>
                <th className="px-5 py-3 text-right font-extrabold uppercase tracking-wide text-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((breed) => (
                <tr
                  key={breed.id}
                  className="border-b-2 border-border/15 last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">
                        {breed.emoji}
                      </span>
                      <span className="font-bold text-text">{breed.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {breed.id}
                  </td>
                  <td className="px-5 py-3 capitalize text-muted">
                    {breed.size}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3 font-bold">
                      <Link
                        href={`/admin/breeds/${breed.id}`}
                        className="transition-smooth text-primary hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/breeds/${breed.id}/edit`}
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
