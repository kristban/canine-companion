// The `Article` domain type. The article catalog itself lives in the
// Supabase `articles` table (same shape as breeds) and is loaded via
// getArticles() (src/lib/getArticles.ts) and managed from /admin/articles.
// See docs/data-model.md and supabase/schema.sql.

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  emoji: string;
  category: string;
  readTime: string;
  tags: string[];
  date: string;
  body: string;
}
