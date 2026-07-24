// Newsletter signups are persisted to the Supabase `newsletter_subscribers`
// table via Supabase's auto-generated REST (PostgREST) API. We call it with
// `fetch` directly instead of pulling in `@supabase/supabase-js` — this is the
// only backend call in the app, so it isn't worth a client-bundle dependency.
// Swap this for the official client if/when breeds also move to Supabase.
//
// RLS on the table allows an anonymous INSERT only (no SELECT), so we send
// `Prefer: return=minimal` and never try to read the row back. The table and
// its policies live in `supabase/schema.sql`.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type SubscribeResult = "ok" | "duplicate" | "error";

export async function subscribeToNewsletter(input: {
  name: string;
  email: string;
}): Promise<SubscribeResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "Newsletter signup skipped: NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. See .env.example.",
    );
    return "error";
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/newsletter_subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ name: input.name, email: input.email }),
      },
    );

    if (response.ok) return "ok";
    // PostgREST maps the unique-email violation (Postgres 23505) to HTTP 409.
    // From the visitor's point of view, "already subscribed" is a success.
    if (response.status === 409) return "duplicate";

    console.error(
      "Newsletter signup failed:",
      response.status,
      await response.text(),
    );
    return "error";
  } catch (error) {
    console.error("Newsletter signup request errored:", error);
    return "error";
  }
}
