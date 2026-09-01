// Server-only Supabase access for the admin interface.
//
// ⚠️  SECURITY  ⚠️
// Every request here is authenticated with the Supabase **service_role** key.
// That key BYPASSES row-level security and can read, update, and delete every
// row in every table. It is read only from `SUPABASE_SERVICE_ROLE_KEY` — a
// non-public env var, so Next.js never inlines it into the browser bundle.
//
// This module (and everything that imports it) must only ever run on the
// server: Server Components and Server Actions. Never import it into a Client
// Component. See docs/data-model.md for the RLS design this deliberately
// steps around (the public site uses the anon key + RLS instead).

import type { AdminResult } from "./result";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const NOT_CONFIGURED_MESSAGE =
  "Admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY (and " +
  "NEXT_PUBLIC_SUPABASE_URL) in .env.local, then restart the dev server.";

const UNREACHABLE_MESSAGE =
  "Couldn't reach the database. Check your connection and Supabase settings.";

/** True once both the Supabase URL and the service-role key are present. */
export function isAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

/** Build a PostgREST `column=eq.value` filter with the value safely encoded. */
export function eq(column: string, value: string): string {
  return `${column}=eq.${encodeURIComponent(value)}`;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "HEAD";
  /** PostgREST query string without the leading `?`, e.g. `id=eq.foo&select=*`. */
  query?: string;
  body?: unknown;
  /** PostgREST `Prefer` header value, e.g. `return=representation`. */
  prefer?: string;
}

interface RawResponse {
  response: Response;
  text: string;
}

/**
 * Low-level request. Returns the raw response + body text on success, or a
 * typed error (never throws). Always `cache: "no-store"` — an admin panel must
 * reflect live database state, never a cached snapshot.
 */
async function request(
  table: string,
  options: RequestOptions,
): Promise<AdminResult<RawResponse>> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { ok: false, error: NOT_CONFIGURED_MESSAGE, notConfigured: true };
  }

  const url =
    `${SUPABASE_URL}/rest/v1/${table}` +
    (options.query ? `?${options.query}` : "");

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.prefer ? { Prefer: options.prefer } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return errorFromResponse(table, response, text);
    }

    return { ok: true, data: { response, text } };
  } catch (error) {
    console.error(`Admin request to "${table}" failed:`, error);
    return { ok: false, error: UNREACHABLE_MESSAGE };
  }
}

/** Turn a non-2xx PostgREST response into a friendly typed error. */
function errorFromResponse(
  table: string,
  response: Response,
  text: string,
): AdminResult<never> {
  // A duplicate primary key or unique constraint (Postgres 23505) surfaces as
  // HTTP 409. Callers translate this into a field-level "already exists" error.
  if (response.status === 409) {
    return { ok: false, error: "That record already exists.", conflict: true };
  }

  let message = `Database error (${response.status}).`;
  try {
    const parsed = JSON.parse(text) as { message?: string; details?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    // Non-JSON body — keep the generic message.
  }

  console.error(
    `Admin request to "${table}" returned ${response.status}:`,
    text,
  );
  return { ok: false, error: message, status: response.status };
}

function parseJson<T>(text: string): T[] {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as T[]) : [parsed as T];
  } catch {
    return [];
  }
}

/** SELECT many rows. */
export async function selectRows<T>(
  table: string,
  query: string,
): Promise<AdminResult<T[]>> {
  const result = await request(table, { query });
  if (!result.ok) return result;
  return { ok: true, data: parseJson<T>(result.data.text) };
}

/** SELECT a single row (by a filter expected to match at most one). */
export async function selectOne<T>(
  table: string,
  query: string,
): Promise<AdminResult<T | null>> {
  const result = await selectRows<T>(table, query);
  if (!result.ok) return result;
  return { ok: true, data: result.data[0] ?? null };
}

/** INSERT one row and return the created row. */
export async function insertRow<T>(
  table: string,
  body: Record<string, unknown>,
): Promise<AdminResult<T>> {
  const result = await request(table, {
    method: "POST",
    body,
    prefer: "return=representation",
  });
  if (!result.ok) return result;
  const rows = parseJson<T>(result.data.text);
  if (rows.length === 0) {
    return { ok: false, error: "The record was not created." };
  }
  return { ok: true, data: rows[0] };
}

/** INSERT a row, or UPDATE it in place if `conflictColumn` already exists. */
export async function upsertRow<T>(
  table: string,
  body: Record<string, unknown>,
  conflictColumn: string,
): Promise<AdminResult<T>> {
  const result = await request(table, {
    method: "POST",
    query: `on_conflict=${conflictColumn}`,
    body,
    prefer: "resolution=merge-duplicates,return=representation",
  });
  if (!result.ok) return result;
  const rows = parseJson<T>(result.data.text);
  if (rows.length === 0) {
    return { ok: false, error: "The record was not saved." };
  }
  return { ok: true, data: rows[0] };
}

/** UPDATE rows matching `query` and return the updated row. */
export async function updateRows<T>(
  table: string,
  query: string,
  body: Record<string, unknown>,
): Promise<AdminResult<T>> {
  const result = await request(table, {
    method: "PATCH",
    query,
    body,
    prefer: "return=representation",
  });
  if (!result.ok) return result;
  const rows = parseJson<T>(result.data.text);
  if (rows.length === 0) {
    return { ok: false, error: "Record not found.", status: 404 };
  }
  return { ok: true, data: rows[0] };
}

/** DELETE rows matching `query`. Reports whether anything was deleted. */
export async function deleteRows(
  table: string,
  query: string,
): Promise<AdminResult<{ deleted: number }>> {
  const result = await request(table, {
    method: "DELETE",
    query,
    prefer: "return=representation",
  });
  if (!result.ok) return result;
  const rows = parseJson<unknown>(result.data.text);
  return { ok: true, data: { deleted: rows.length } };
}

/** Exact row count for a table, via the `Content-Range` header. */
export async function countRows(table: string): Promise<AdminResult<number>> {
  const result = await request(table, {
    method: "HEAD",
    query: "select=id",
    prefer: "count=exact",
  });
  if (!result.ok) return result;
  // Content-Range looks like "0-24/25" or "*/0"; the total is after the slash.
  const range = result.data.response.headers.get("content-range");
  const total = range ? Number(range.split("/")[1]) : NaN;
  return { ok: true, data: Number.isFinite(total) ? total : 0 };
}
