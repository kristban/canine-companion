"use server";

// Client-callable check for whether an email is on the admin allowlist. Lets
// AuthNav decide whether to show the "Admin" menu item without ever exposing
// ADMIN_ALLOWED_EMAILS itself to the browser — only this yes/no answer for
// the current user's own email crosses the network.

import { isEmailAllowed } from "./allowlist";

export async function isAdminEmail(
  email: string | null | undefined,
): Promise<boolean> {
  return isEmailAllowed(email);
}
