import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles } from "@/lib/getArticles";

export const metadata: Metadata = {
  title: "Paws & Pointers — Canine Companion",
  description:
    "Practical guides and articles for new and existing dog parents, covering training, health, and everyday life with a dog.",
};

// Standalone route — renders its own Header/Footer chrome (like /breeds and
// not-found.tsx), not part of AppShell. Header gets no props, so "Start the
// quiz" falls back to /?start=quiz, which AppShell reads on mount (see
// docs/architecture.md).
export default async function GuidesPage() {
  const articles = await getArticles();
  const hasArticles = articles.length > 0;

  // Bucket articles into categories, in the order categories first appear in
  // `articles` (sorted by published_at desc — see getArticles()). Unlike
  // breed groups, article categories are free text set per-article in
  // /admin/articles, so there's no fixed registry to order by instead.
  const categories = Array.from(new Set(articles.map((a) => a.category)));
  const grouped = categories.map((category) => ({
    category,
    articles: articles.filter((a) => a.category === category),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-wide text-link">
              Everything they don&apos;t tell you at the pet shop
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Paws &amp; <span className="text-link">Pointers</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Honest guides for Irish dog owners — the licence you need, the
              vet bill you didn&apos;t budget for, and the two weeks after you
              bring them home.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-muted">
              No fluff, no filler, and no advice borrowed from a country with
              different laws and better weather.
            </p>
          </div>

          {hasArticles ? (
            <div className="mt-12 flex flex-col gap-14">
              {grouped.map(({ category, articles: categoryArticles }) => {
                const headingId = `category-${category
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}`;
                return (
                  <section key={category} aria-labelledby={headingId}>
                    <h2
                      id={headingId}
                      className="font-display text-2xl font-semibold tracking-tight text-text"
                    >
                      {category}
                    </h2>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto mt-12 max-w-md rounded-3xl border-3 border-border bg-surface p-8 text-center shadow-hard">
              <span
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-secondary text-4xl"
                aria-hidden="true"
              >
                📝
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-text">
                New guides are on the way
              </h2>
              <p className="mt-2 text-muted">
                We&apos;re writing our first batch of articles — check back
                soon.
              </p>
            </div>
          )}
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
