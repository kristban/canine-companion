// Role data for the signed-in user — see the `user_roles` table in
// supabase/schema.sql. This is a DB-backed *reflection* of admin status, kept
// in sync with the allowlist on every sign-in (src/app/auth/callback/route.ts
// calls syncUserRole()); it is NOT the authorization boundary. requireAdmin()
// (src/lib/auth/requireAdmin.ts) still re-checks ADMIN_ALLOWED_EMAILS
// directly and is what actually gates /admin. This module exists so a role
// is real, queryable data — e.g. to display on /account — rather than
// something that only lives in an env var.

import { upsertRow } from "@/lib/admin/http";
import type { AdminResult } from "@/lib/admin/result";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "user" | "admin";

export const USER_ROLES_TABLE = "user_roles";

interface UserRoleRow {
  user_id: string;
  role: UserRole;
}

/**
 * Write `userId`'s role via the service-role key (the anon/authenticated key
 * has no write privilege on this table — see the RLS policies in
 * supabase/schema.sql). Best-effort: a failure here never blocks sign-in,
 * since the allowlist check remains authoritative regardless of whether this
 * row is up to date.
 */
export async function syncUserRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  const result: AdminResult<UserRoleRow> = await upsertRow<UserRoleRow>(
    USER_ROLES_TABLE,
    { user_id: userId, role },
    "user_id",
  );
  if (!result.ok) {
    console.error(`Failed to sync role for user ${userId}:`, result.error);
  }
}

/** Read the signed-in user's own role (RLS-scoped, anon key + session). */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(USER_ROLES_TABLE)
    .select("role")
    .eq("user_id", userId)
    .maybeSingle<{ role: UserRole }>();
  return data?.role ?? "user";
}
