import Link from "next/link";
import { Article } from "@/lib/articles";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/guides/${article.id}`}
      className="transition-smooth flex flex-col gap-3 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-secondary/40 text-3xl"
        aria-hidden="true"
      >
        {article.emoji}
      </span>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-link">
          {article.category} · {article.readTime}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-text">
          {article.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}
