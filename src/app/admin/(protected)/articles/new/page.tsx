import { createArticle } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { AdminPageHeading, ConfigNotice } from "@/components/admin/ui";

export default function NewArticlePage() {
  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title="New article"
        backHref="/admin/articles"
        backLabel="Articles"
        description="Publish a new guide to the /guides section."
      />
      {isAdminConfigured() ? (
        <ArticleForm action={createArticle} article={null} mode="create" />
      ) : (
        <ConfigNotice />
      )}
    </div>
  );
}
