// Server-only newsletter-subscriber data access + form validation for the
// admin interface. Reading, updating, and deleting subscribers is impossible
// with the public anon key (RLS allows anonymous INSERT only), which is exactly
// why the admin layer uses the service-role key. See http.ts / docs/data-model.md.

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
import {
  type Subscriber,
  type SubscriberStatus,
  SUBSCRIBER_STATUSES,
} from "./types";

const TABLE = "newsletter_subscribers";

// Same regex the public signup form uses, for consistency.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubscriberRow {
  id: string;
  name: string;
  email: string;
  status: SubscriberStatus;
  created_at: string;
}

function mapRow(row: SubscriberRow): Subscriber {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listSubscribers(): Promise<AdminResult<Subscriber[]>> {
  const result = await selectRows<SubscriberRow>(
    TABLE,
    "select=*&order=created_at.desc",
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.map(mapRow) };
}

export async function getSubscriber(
  id: string,
): Promise<AdminResult<Subscriber | null>> {
  const result = await selectOne<SubscriberRow>(TABLE, `${eq("id", id)}&select=*`);
  if (!result.ok) return result;
  return { ok: true, data: result.data ? mapRow(result.data) : null };
}

export function countSubscribers(): Promise<AdminResult<number>> {
  return countRows(TABLE);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface SubscriberInput {
  name: string;
  email: string;
  status: SubscriberStatus;
}

type ValidationResult =
  | { ok: true; value: SubscriberInput }
  | { ok: false; errors: Record<string, string> };

export function validateSubscriber(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {};

  const nameRaw = formData.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (!name) errors.name = "Name is required.";

  const emailRaw = formData.get("email");
  const email = typeof emailRaw === "string" ? emailRaw.trim() : "";
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const statusRaw = formData.get("status");
  const status = typeof statusRaw === "string" ? statusRaw : "";
  if (!SUBSCRIBER_STATUSES.includes(status as SubscriberStatus)) {
    errors.status = "Choose a status.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, email, status: status as SubscriberStatus },
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function createSubscriberRow(
  input: SubscriberInput,
): Promise<AdminResult<Subscriber>> {
  return insertRow<SubscriberRow>(TABLE, { ...input }).then((result) =>
    result.ok ? { ok: true, data: mapRow(result.data) } : result,
  );
}

export function updateSubscriberRow(
  id: string,
  input: SubscriberInput,
): Promise<AdminResult<Subscriber>> {
  return updateRows<SubscriberRow>(TABLE, eq("id", id), { ...input }).then(
    (result) => (result.ok ? { ok: true, data: mapRow(result.data) } : result),
  );
}

export function deleteSubscriberRow(
  id: string,
): Promise<AdminResult<{ deleted: number }>> {
  return deleteRows(TABLE, eq("id", id));
}
