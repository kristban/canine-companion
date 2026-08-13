// Server-only article data access + form validation for the admin interface.
// Imports the service-role HTTP layer, so this must never be pulled into a
// Client Component (see http.ts).

import type { AdminResult } from "./result";
import {
  countRows,
  deleteRows,
  eq,
  insertRow,
  selectOne,
  selectRows,
  updateRows,
} from "./http";
import type { AdminArticle } from "./types";

const TABLE = "articles";

// Row shape as stored in Postgres (snake_case columns).
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
  created_at?: string;
  updated_at?: string;
}

function mapRow(row: ArticleRow): AdminArticle {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    emoji: row.emoji,
    category: row.category,
    tags: row.tags,
    readingTime: row.reading_time,
    body: row.body,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listArticles(): Promise<AdminResult<AdminArticle[]>> {
  const result = await selectRows<ArticleRow>(
    TABLE,
    "select=*&order=published_at.desc",
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.map(mapRow) };
}

export async function getArticle(
  id: string,
): Promise<AdminResult<AdminArticle | null>> {
  const result = await selectOne<ArticleRow>(TABLE, `${eq("id", id)}&select=*`);
  if (!result.ok) return result;
  return { ok: true, data: result.data ? mapRow(result.data) : null };
}

export function countArticles(): Promise<AdminResult<number>> {
  return countRows(TABLE);
}

// ---------------------------------------------------------------------------
// Validation — mirrors the DB constraints so users get friendly field errors
// instead of raw 400s. Returns the validated column payload (snake_case)
// ready for insert/update, or a map of field errors keyed by form field name.
// ---------------------------------------------------------------------------

export interface ArticleInput {
  columns: Record<string, unknown>;
  id: string;
}

type ValidationResult =
  | { ok: true; value: ArticleInput }
  | { ok: false; errors: Record<string, string> };

function requiredText(
  errors: Record<string, string>,
  field: string,
  raw: FormDataEntryValue | null,
  label: string,
): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) errors[field] = `${label} is required.`;
  return value;
}

/** Comma-separated tag input -> trimmed, non-empty tag list. */
function parseTags(raw: FormDataEntryValue | null): string[] {
  const value = typeof raw === "string" ? raw : "";
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function validateArticle(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {};

  const id = requiredText(errors, "id", formData.get("id"), "ID");
  const title = requiredText(errors, "title", formData.get("title"), "Title");
  const emoji = requiredText(errors, "emoji", formData.get("emoji"), "Emoji");
  const category = requiredText(
    errors,
    "category",
    formData.get("category"),
    "Category",
  );
  const excerpt = requiredText(
    errors,
    "excerpt",
    formData.get("excerpt"),
    "Excerpt",
  );
  const body = requiredText(errors, "body", formData.get("body"), "Body");

  const readingTimeRaw = formData.get("readingTime");
  const readingTimeStr =
    typeof readingTimeRaw === "string" ? readingTimeRaw.trim() : "";
  let readingTime = 0;
  if (!readingTimeStr) {
    errors.readingTime = "Reading time is required.";
  } else {
    readingTime = Number(readingTimeStr);
    if (!Number.isInteger(readingTime) || readingTime < 1 || readingTime > 60) {
      errors.readingTime = "Must be a whole number of minutes, 1 to 60.";
    }
  }

  const publishedAt = requiredText(
    errors,
    "publishedAt",
    formData.get("publishedAt"),
    "Published date",
  );

  const tags = parseTags(formData.get("tags"));

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const columns: Record<string, unknown> = {
    id,
    title,
    excerpt,
    emoji,
    category,
    tags,
    reading_time: readingTime,
    body,
    published_at: publishedAt,
  };

  return { ok: true, value: { columns, id } };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function createArticleRow(
  input: ArticleInput,
): Promise<AdminResult<AdminArticle>> {
  return insertRow<ArticleRow>(TABLE, input.columns).then((result) =>
    result.ok ? { ok: true, data: mapRow(result.data) } : result,
  );
}

export function updateArticleRow(
  id: string,
  columns: Record<string, unknown>,
): Promise<AdminResult<AdminArticle>> {
  // `id` is the primary key and immutable here — never send it in the update.
  const { id: _ignored, ...rest } = columns;
  void _ignored;
  return updateRows<ArticleRow>(TABLE, eq("id", id), rest).then((result) =>
    result.ok ? { ok: true, data: mapRow(result.data) } : result,
  );
}

export function deleteArticleRow(
  id: string,
): Promise<AdminResult<{ deleted: number }>> {
  return deleteRows(TABLE, eq("id", id));
}
