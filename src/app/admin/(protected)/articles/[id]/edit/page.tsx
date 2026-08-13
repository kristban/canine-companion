import { getArticle } from "@/lib/admin/articles";
import { updateArticle } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading
          title="Edit article"
          backHref="/admin/articles"
          backLabel="Articles"
        />
        <ConfigNotice />
      </div>
    );
  }

  const result = await getArticle(id);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading
          title="Edit article"
          backHref="/admin/articles"
          backLabel="Articles"
        />
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load article">
          <p>{result.error}</p>
        </AdminNotice>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading
          title="Article not found"
          backHref="/admin/articles"
          backLabel="Articles"
        />
        <AdminNotice variant="error" icon="🔎" title="Article not found">
          <p>
            No article exists with ID{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[0.8em]">
              {id}
            </code>
            .
          </p>
        </AdminNotice>
      </div>
    );
  }

  const article = result.data;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="Edit article"
        backHref={`/admin/articles/${article.id}`}
        backLabel={article.title}
      />
      <ArticleForm
        action={updateArticle.bind(null, article.id)}
        article={article}
        mode="edit"
      />
    </div>
  );
}
