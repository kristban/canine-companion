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

`breeds.ts` now defines only the `Breed` type — there is no bundled breed data.
`getBreeds()` (`src/lib/getBreeds.ts`) loads the catalog from the Supabase
`breeds` table at request time and maps its snake_case columns
(`good_with_kids`) to the camelCase `Breed` shape (`goodWithKids`). Supabase is
the single source of truth; if it isn't configured or is unreachable,
`getBreeds()` returns an empty array and the UI shows an empty state.

Every breed scores 12 traits on a 1–5 scale (1 = very low, 5 = very high):
`energy`, `grooming`, `trainability`, `goodWithKids`, `goodWithOtherPets`,
`apartmentFriendly`, `independence`, `noviceFriendly`, `vocal`,
`runningPartner`, `heatTolerance`, `coldTolerance`. Each breed also has a
`size: "small" | "medium" | "large"`.

**To add a breed:** insert a row into the Supabase `breeds` table with all 12
trait fields plus `id`, `name`, `emoji`, `tagline`, `description`, `size`. The
table enforces the 1–5 range and required fields via check/not-null constraints
(see `supabase/schema.sql`).

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

`Results.tsx` shows the top 5. There's no tie-breaking beyond stable array sort.

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

Quiz answers, results, and the breed catalog are **not** stored here — they
remain static/client-side as described above.
