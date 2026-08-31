import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { ArticleBody } from "@/components/ArticleBody";
import { getArticles } from "@/lib/getArticles";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const articles = await getArticles();
  const article = articles.find((a) => a.id === slug);
  if (!article) return {};
  return {
    title: `${article.title} — Paws & Pointers`,
    description: article.excerpt,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Standalone route — renders its own Header/Footer chrome (like /breeds and
// /guides), not part of AppShell. Header gets no props, so "Start the quiz"
// falls back to /?start=quiz, which AppShell reads on mount (see
// docs/architecture.md).
//
// No generateStaticParams/dynamicParams here — deliberately fully dynamic
// (like /breeds), so an article added via /admin/articles appears here
// without a redeploy. See getArticles()'s hourly revalidate.
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const articles = await getArticles();
  const article = articles.find((a) => a.id === slug);
  if (!article) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <Link
            href="/guides"
            className="transition-smooth text-sm font-bold text-muted hover:text-link"
          >
            ← All guides
          </Link>

          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-wide text-link">
              {article.category} · {article.readTime}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-3 text-sm text-muted">
              Last updated {formatDate(article.date)}
            </p>
          </div>

          <div className="mt-2">
            <ArticleBody body={article.body} />
          </div>

          {article.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2 border-t-2 border-border pt-6">
              {article.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border-2 border-border bg-background-alt px-3 py-1 text-xs font-bold text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </article>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
