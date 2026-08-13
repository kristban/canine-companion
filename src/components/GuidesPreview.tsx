import Link from "next/link";
import { articles } from "@/lib/articles";
import { ArticleCard } from "./ArticleCard";

export function GuidesPreview() {
  const featured = articles.slice(0, 3);

  return (
    <section
      aria-labelledby="guides-heading"
      className="w-full border-t-3 border-border bg-background-alt"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2
            id="guides-heading"
            className="scroll-mt-24 font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl"
          >
            Matched your breed? Now the real work starts.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted">
            Our advice section covers the bits that come after the quiz —
            the dog licence you need within four months, what a vet actually
            costs in Ireland, and how to introduce a new dog to the cat who
            was here first.
          </p>
        </div>

        {featured.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {featured.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-md text-center text-muted">
            New guides are on the way — check back soon.
          </p>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/guides"
            className="transition-smooth inline-block rounded-full border-2 border-border bg-surface px-6 py-3 text-sm font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Read the guides →
          </Link>
        </div>
      </div>
    </section>
  );
}
