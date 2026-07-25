// A small discriminated-union result type for the admin data layer, so callers
// can distinguish "not configured" and "conflict" from generic failures and
// render the right UI, without anything throwing. Pure types — safe anywhere.

export type AdminResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      /** Supabase/env not set up — render the configuration notice. */
      notConfigured?: boolean;
      /** Unique/primary-key conflict (HTTP 409) — e.g. duplicate id or email. */
      conflict?: boolean;
      /** HTTP status when the failure came from a database response. */
      status?: number;
    };
