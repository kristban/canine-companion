import type { MDXComponents } from "mdx/types";
import Link from "next/link";

// Global styling for article content rendered from src/content/advice/*.mdx.
// Required by @next/mdx for the App Router (see docs/conventions.md). Maps
// markdown output to the site's design-system tokens instead of relying on a
// generic prose plugin, consistent with how the rest of the app is styled.
const components: MDXComponents = {
  h2: ({ children, ...props }) => (
    <h2
      className="mt-10 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mt-8 font-display text-xl font-semibold tracking-tight text-text"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-4 text-base leading-relaxed text-muted" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-text" {...props}>
      {children}
    </strong>
  ),
  a: ({ children, href, ...props }) => (
    <Link
      href={href ?? "#"}
      className="transition-smooth font-semibold text-primary underline decoration-2 underline-offset-2 hover:no-underline"
      {...props}
    >
      {children}
    </Link>
  ),
  ul: ({ children, ...props }) => (
    <ul
      className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-muted"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-muted"
      {...props}
    >
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mt-6 rounded-2xl border-2 border-border bg-background-alt p-4 text-sm leading-relaxed text-muted"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="mt-6 overflow-x-auto rounded-2xl border-2 border-border">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b-2 border-border bg-background-alt px-3 py-2 text-left font-bold text-text"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border-b border-border/40 px-3 py-2 align-top text-muted"
      {...props}
    >
      {children}
    </td>
  ),
};

export function useMDXComponents(inherited: MDXComponents): MDXComponents {
  return { ...inherited, ...components };
}
