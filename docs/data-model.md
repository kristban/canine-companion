# Data & matching logic

The quiz and matching logic in `src/lib/` is pure data + pure functions. The
breed catalog loads from the Supabase `breeds` table via `getBreeds()`
(`src/lib/getBreeds.ts`) — the single source of truth, with no bundled data; if
Supabase isn't configured or reachable it returns an empty list and the UI
shows an empty state (see below). The newsletter signup also writes to Supabase
(see the end of this file). Matching itself still runs client-side at
quiz-completion time in `AppShell.handleComplete`, over the breeds passed down
as props.

## `src/lib/breeds.ts`

`breeds.ts` defines the `Breed` type plus the group taxonomy (`BreedGroup`,
`BREED_GROUPS`) — there is no bundled breed data. `getBreeds()`
(`src/lib/getBreeds.ts`) loads the catalog from the Supabase `breeds` table at
request time and maps its snake_case columns (`good_with_kids`, `breed_group`)
to the camelCase `Breed` shape (`goodWithKids`, `group`). Supabase is the single
source of truth; if it isn't configured or is unreachable, `getBreeds()` returns
an empty array and the UI shows an empty state.

Every breed scores 12 traits on a 1–5 scale (1 = very low, 5 = very high):
`energy`, `grooming`, `trainability`, `goodWithKids`, `goodWithOtherPets`,
`apartmentFriendly`, `independence`, `noviceFriendly`, `vocal`,
`runningPartner`, `heatTolerance`, `coldTolerance`. Each breed also has a
`size: "small" | "medium" | "large"` and a `group` (one of `gundog`, `hound`,
`working`, `terrier`, `pastoral`, `toy`, `utility` — the Irish Kennel Club /
UK Kennel Club seven-group system, not AKC groups; see `breeds.ts` for the
notable naming differences).

`group` is a **browsing/organisation aid only** — it groups the `/breeds`
gallery and gives the admin table a filter. It is deliberately **not** used by
the matcher (`match.ts`), which scores the numeric traits + size directly; a
group is just a fuzzy proxy for traits we already measure precisely. The
group order + user-facing labels/blurbs live in `BREED_GROUPS` in `breeds.ts`
(the single source of truth, re-exported through `src/lib/admin/types.ts`).

**To add a breed:** insert a row into the Supabase `breeds` table with all 12
trait fields plus `id`, `name`, `emoji`, `tagline`, `description`, `size`, and
`breed_group`. The table enforces the 1–5 range, the allowed size/group values,
and required fields via check/not-null constraints (see `supabase/schema.sql`).

## `src/lib/articles.ts` and the `articles` table

`articles.ts` defines the `Article` type only — no bundled data, same split as
`breeds.ts` / `getBreeds.ts`. `getArticles()` (`src/lib/getArticles.ts`) loads
the "Paws & Pointers" catalog (`/guides`) from the Supabase `articles` table
at request time, mapping snake_case columns (`reading_time`, `published_at`)
to the camelCase `Article` shape (`readTime` — formatted as `"9 min read"`,
`date`). If Supabase isn't configured or is unreachable, `getArticles()`
returns an empty array and the UI shows an empty state, identically to
`getBreeds()`.

Columns: `id` (text, PK — the slug used in the `/guides/[slug]` URL), `title`,
`excerpt`, `emoji`, `category` (free text — no fixed registry like
`BREED_GROUPS`, since the catalog is small and fully admin-curated),
`tags` (`text[]`), `reading_time` (smallint, 1–60), `body` (text — the
article's markdown), `published_at` (date), plus `created_at` / `updated_at`.
See `supabase/schema.sql` for the full constraints.

`body` is rendered with `<ArticleBody>` (`src/components/ArticleBody.tsx`),
which wraps `react-markdown` + `remark-gfm` (table support) with components
mapped to the design system's styling — headings, links, tables, blockquotes,
and lists don't fall back to react-markdown's bare HTML. Article content is
plain markdown, not MDX: no embedded JSX/components, since bodies are
admin-authored via a `<textarea>` in `/admin/articles`, not files reviewed in
a PR.

**To publish an article:** use `/admin/articles` → "New article" (or edit an
existing one). No code change or redeploy needed — `getArticles()` revalidates
hourly, and every admin write additionally calls `revalidatePath` on the
public `/guides` routes, so changes appear immediately after saving. The admin
form and data layer (`src/lib/admin/articles.ts`,
`src/components/admin/ArticleForm.tsx`) mirror the breeds admin exactly; see
`docs/architecture.md` → "Admin authentication" for how `/admin` itself is
gated.

## `src/lib/questions.ts`

`questions` is an ordered array of `QuizQuestion`, each with 2–4 `QuizOption`s.
Every option carries `contributions: TraitContribution[]` — the thing that
actually affects matching. A `TraitContribution` is:

```ts
{ trait: Trait, target: number, mode: "min" | "max" | "match", weight: number }
```

- `mode: "min"` — breed's trait value should be **at least** `target`; only
  penalized if it falls short (e.g. picking "young kids" wants
  `goodWithKids >= 5`).
- `mode: "max"` — breed's trait value should be **at most** `target`; only
  penalized if it exceeds it (e.g. picking "minimal grooming" wants
  `grooming <= 2`).
- `mode: "match"` — breed's trait value should be **close to** `target` in
  either direction (used for things like desired energy level).
- `weight` scales how much that contribution matters relative to others.

An option can have an empty `contributions: []` array — that's the neutral/
"no strong preference" choice on several questions.

The size question is special: options set `sizePreference: Size[]` instead of
(or alongside) `contributions`; this feeds a flat penalty in the matcher
rather than a per-trait one.

**To add a question:** append to `questions`, give each option realistic
`contributions` using existing `Trait` names. Introducing a *new* trait means
adding a column to the Supabase `breeds` table (and `supabase/schema.sql`),
mapping it in `getBreeds`, and adding it to the `Breed` type in `breeds.ts`.

## `src/lib/match.ts`

`matchBreeds(answers, breeds)` — the breed list is loaded via `getBreeds()`,
threaded through props, and passed in as the second argument:

1. Sums `weight * 4` (max possible per-contribution penalty) across every
   answered contribution to get `maxPossiblePenalty`, plus a flat
   `SIZE_MISMATCH_PENALTY` (5) if any size preference was given.
2. For every breed, sums the actual penalty across all contributions
   (per the min/max/match rules above), plus the size penalty if the breed's
   size isn't in the selected `sizePreference` set.
3. Converts penalty into `matchPercent = 100 * (1 - penalty / maxPossiblePenalty)`,
   clamped to 0–100 and rounded.
4. Returns all breeds sorted by `matchPercent` descending.

`Results.tsx` shows the top 5, plus (when the quiz produced a real spread of
scores) the bottom 3 as "Probably not a fit". There's no tie-breaking beyond
stable array sort.

`explainMatch(breed, answers)` reuses the same per-contribution shortfall math
to explain *why* a single breed scored the way it did — the top 2 traits it
fit perfectly and the top 2 it fell short on (deduped by trait, weighted),
as `{ good: string[]; bad: string[] }`. `summarizeGoodMatch` /
`summarizePoorMatch` turn that into a one-sentence, plain-language summary for
a top or bottom result respectively. Deliberately not computed inside
`matchBreeds` (which runs for every breed in the catalog on every quiz
completion) — call `explainMatch` only for the handful of breeds actually
rendered. All plain-language phrasing lives in `TRAIT_REASON_PHRASES` in
`match.ts`; no breed-level data is needed for this, since it's derived
entirely from the same trait scores + quiz answers the matcher already uses.

## `newsletter_subscribers` (Supabase) — the one exception to "no backend"

The newsletter form is the only feature that persists data server-side.
`SignupForm` calls `subscribeToNewsletter` in `src/lib/newsletter.ts`, which
`POST`s `{ name, email }` to the Supabase `newsletter_subscribers` table via
its REST endpoint (a plain `fetch`, no `@supabase/supabase-js`).

- **Schema + row-level security:** `supabase/schema.sql`. Columns: `id` (uuid),
  `name`, `email` (`citext`, unique/case-insensitive), `status`, `created_at`.
- **RLS:** anonymous **INSERT** only. The client can add a signup but cannot
  read, update, or delete rows, so the list can't be scraped with the public
  anon key. The insert therefore uses `Prefer: return=minimal` (no read-back).
- **Duplicate emails:** the unique constraint makes PostgREST return HTTP 409;
  `subscribeToNewsletter` maps that to `"duplicate"`, which the form treats as a
  successful signup (no email-enumeration leak).
- **Config:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (see `.env.example`).

## `saved_results` (Supabase) — opt-in, per-user, RLS-scoped

When public Google login shipped, signed-in users gained the ability to **save**
a quiz result set. This is the only per-user table, and unlike everything else
it's accessed with the **user's own session** (anon key + RLS), never the
service-role key.

- **Schema + RLS:** `supabase/schema.sql`. Columns: `id` (uuid), `user_id` (uuid,
  `references auth.users`, defaults to `auth.uid()`), `title`, `results` (jsonb —
  top breeds `[{id,name,emoji,matchPercent}]`), `answers` (jsonb — recap
  `[{question,label,icon}]`), `created_at`.
- **RLS:** `select` / `insert` / `delete` policies all keyed on
  `auth.uid() = user_id`, so a user can only ever see or touch their own rows. No
  update policy — saved snapshots are immutable.
- **Client code:** `src/lib/results.ts` builds the compact snapshot;
  `SaveResultsButton` inserts via the browser client;
  `src/app/results/page.tsx` reads them with the server client;
  `SavedResultsList` deletes. Nothing here uses the service-role key.

Taking the quiz still writes **nothing** — a snapshot is stored only when a
signed-in user explicitly clicks Save. The breed catalog and the live quiz
answers/results otherwise remain static/client-side as described above.

## `profiles` (Supabase) — public identity

A per-user table accessed with the **user's own session** (RLS, never
service-role): `id` (uuid, PK, = `auth.uid()`), `username` (citext, unique,
`^[a-z0-9_]{3,20}$`), `display_name`, `avatar_url`, `bio`, timestamps.

- **RLS:** `select` is open to `anon` + `authenticated` (`using (true)`) —
  anyone can read any profile. `insert` / `update` / `delete` are restricted to
  the owner (`auth.uid() = id`).
- **App UI:** editable from `/account` (`src/app/account/page.tsx`), which
  server-fetches the caller's own row and renders `PublicProfileForm` (upserts
  by `id`) alongside `AccountForm` (sign-in email only — display name lives on
  the profile instead, and saving it there also syncs
  `user_metadata.display_name` so the nav stays in sync without a separate
  profile fetch). Types/constants live in `src/lib/profile.ts`. The public
  *viewing* page is `/u/[username]` (`src/app/u/[username]/page.tsx`, a
  standalone route hand-rolled like `/breeds` — read-only, server-fetched by
  username via the anon key); `/account` links to the signed-in user's own
  page once they've set a username. There's no directory/search across
  profiles — only someone who already has the username (shared via that
  link) can reach it.

## `user_roles` (Supabase) — role data, synced from the admin allowlist

A DB-backed reflection of admin status, separate from `profiles` because it's
keyed by every signed-in user (`user_id`, PK, `references auth.users`), not
just the ones who've set a username. Columns: `user_id`, `role` (`'user' |
'admin'`, default `'user'`), `updated_at`.

- **RLS:** `select` is restricted to the owner (`auth.uid() = user_id`). No
  `insert`/`update`/`delete` policy is granted to `anon`/`authenticated` at
  all — only the service-role key (bypasses RLS) can write a role, so a user
  can never elevate their own role through the public API.
- **Sync:** `src/app/auth/callback/route.ts` calls `syncUserRole()`
  (`src/lib/auth/role.ts`) after every sign-in — admin and public login alike
  — upserting `role` based on `isEmailAllowed()`
  (`src/lib/auth/allowlist.ts`). This is a **reflection, not the
  authorization boundary**: `requireAdmin()` and the proxy still check the
  allowlist directly and never read this table — see
  `docs/architecture.md` → "Roles are a DB reflection, not the boundary".
  A role only updates on the affected user's next sign-in, not the instant
  the allowlist changes.
- **App UI:** `getUserRole()` reads the caller's own row (RLS-scoped, anon
  key) to show a Member/Admin badge on `/account`.
