import { Article } from "./articles";

// Row shape as returned by the Supabase REST API (snake_case columns).
interface ArticleRow {
  id: string;
  title: string;
  excerpt: string;
  emoji: string;
  category: string;
  tags: string[];
  reading_time: number;
  body: string;
  published_at: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function mapRow(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    emoji: row.emoji,
    category: row.category,
    tags: row.tags,
    readTime: `${row.reading_time} min read`,
    date: row.published_at,
    body: row.body,
  };
}

/**
 * Loads the article catalog from the Supabase `articles` table — the single
 * source of truth, managed from /admin/articles. There is no bundled
 * fallback: if Supabase isn't configured or the request fails, this returns
 * an empty array and callers render an empty state.
 *
 * Server-only — it relies on the Next.js data cache (`next.revalidate`) and
 * should be called from Server Components, with the result passed down as
 * props (see `src/app/page.tsx`, `src/app/guides/page.tsx`, and
 * `src/app/guides/[slug]/page.tsx`). Client components receive articles via
 * props, never by calling this.
 */
export async function getArticles(): Promise<Article[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "Cannot load articles: NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. See .env.example.",
    );
    return [];
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=*&order=published_at.desc,created_at.asc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        // Cache the catalog and refresh it hourly rather than hitting the DB
        // on every request. Article edits in /admin appear within the hour.
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to load articles from Supabase.",
        response.status,
        await response.text(),
      );
      return [];
    }

    const rows = (await response.json()) as ArticleRow[];
    return Array.isArray(rows) ? rows.map(mapRow) : [];
  } catch (error) {
    console.error("Error loading articles from Supabase.", error);
    return [];
  }
}
