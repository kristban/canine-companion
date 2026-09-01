import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders an article's markdown body (from the `articles.body` column — see
// docs/data-model.md) with the site's design-system styling instead of
// react-markdown's bare HTML output. remark-gfm adds table support, which
// the articles rely on.
const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 font-display text-xl font-semibold tracking-tight text-text">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-relaxed text-muted">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-text">{children}</strong>
  ),
  a: ({ children, href }) => (
    <Link
      href={href ?? "#"}
      className="transition-smooth font-semibold text-link underline decoration-2 underline-offset-2 hover:no-underline"
    >
      {children}
    </Link>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-muted">
      {children}
    </ol>
  ),
  img: ({ src, alt }) => (
    // Arbitrary author-supplied URL (from the markdown body) — not run
    // through next/image, which only allows a fixed set of remote hosts
    // (see next.config.ts). Same pattern as the breed photo on
    // /breeds/[slug]. No forced aspect ratio/cropping so the whole photo
    // shows regardless of orientation.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="mt-6 w-full rounded-2xl border-2 border-border shadow-hard-sm"
    />
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 rounded-2xl border-2 border-border bg-background-alt p-4 text-sm leading-relaxed text-muted">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b-2 border-border bg-background-alt px-3 py-2 text-left font-bold text-text">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/40 px-3 py-2 align-top text-muted">
      {children}
    </td>
  ),
};

export function ArticleBody({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {body}
    </ReactMarkdown>
  );
}
