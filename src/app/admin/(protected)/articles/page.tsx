import { listArticles } from "@/lib/admin/articles";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { ArticlesTable } from "@/components/admin/ArticlesTable";
import {
  AdminPageHeading,
  ButtonLink,
  ConfigNotice,
} from "@/components/admin/ui";

export default async function ArticlesListPage() {
  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading
          title="Articles"
          backHref="/admin"
          backLabel="Dashboard"
        />
        <ConfigNotice />
      </div>
    );
  }

  const result = await listArticles();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Articles"
        backHref="/admin"
        backLabel="Dashboard"
        description="The Paws & Pointers content powering the public /guides section."
        action={
          <ButtonLink href="/admin/articles/new">+ New article</ButtonLink>
        }
      />

      {!result.ok ? (
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load articles">
          <p>{result.error}</p>
        </AdminNotice>
      ) : result.data.length === 0 ? (
        <AdminNotice icon="📝" title="No articles yet">
          <p>Add the first article with the “New article” button above.</p>
        </AdminNotice>
      ) : (
        <ArticlesTable articles={result.data} />
      )}
    </div>
  );
}
