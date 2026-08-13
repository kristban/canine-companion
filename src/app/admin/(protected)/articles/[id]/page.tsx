import Link from "next/link";
import { getArticle } from "@/lib/admin/articles";
import { deleteArticle } from "@/lib/admin/actions";
import { isAdminConfigured } from "@/lib/admin/http";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { ArticleBody } from "@/components/ArticleBody";
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

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeading
          title="Article"
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
          title="Article"
          backHref="/admin/articles"
          backLabel="Articles"
        />
        <AdminNotice variant="error" icon="⚠️" title="Couldn't load article">
          <p>{result.error}</p>
        </AdminNotice>
      </div>
    );
  }

  const article = result.data;

  if (!article) {
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

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeading
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden="true">{article.emoji}</span>
            {article.title}
          </span>
        }
        backHref="/admin/articles"
        backLabel="Articles"
        description={article.excerpt}
        action={
          <div className="flex gap-3">
            <ButtonLink href={`/guides/${article.id}`} variant="secondary">
              View live
            </ButtonLink>
            <ButtonLink href={`/admin/articles/${article.id}/edit`}>
              Edit
            </ButtonLink>
          </div>
        }
      />

      <div className="flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-text">{article.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Category
            </dt>
            <dd className="mt-1 text-text">{article.category}</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Reading time
            </dt>
            <dd className="mt-1 text-text">{article.readingTime} min</dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Published
            </dt>
            <dd className="mt-1 text-text">{article.publishedAt}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Tags
            </dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {article.tags.length > 0 ? (
                article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border-2 border-border bg-background-alt px-3 py-1 text-xs font-bold text-muted"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">No tags</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Created
            </dt>
            <dd className="mt-1 text-sm text-muted">
              {formatDate(article.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
              Updated
            </dt>
            <dd className="mt-1 text-sm text-muted">
              {formatDate(article.updatedAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
        <h2 className="font-display text-lg font-semibold text-text">
          Body preview
        </h2>
        <p className="mt-1 text-sm text-muted">
          Rendered the same way it appears on{" "}
          <Link
            href={`/guides/${article.id}`}
            className="font-semibold text-primary hover:underline"
          >
            /guides/{article.id}
          </Link>
          .
        </p>
        <div className="mt-4 border-t-2 border-border pt-4">
          <ArticleBody body={article.body} />
        </div>
      </div>

      <div className="rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <h2 className="font-display text-lg font-semibold text-text">
          Danger zone
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Permanently remove this article from the catalog.
        </p>
        <DeleteButton
          action={deleteArticle}
          id={article.id}
          itemLabel={article.title}
        />
      </div>
    </div>
  );
}
