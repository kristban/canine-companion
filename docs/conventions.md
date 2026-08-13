# Conventions

## Components

- One component per file, PascalCase filename matching the exported name
  (`Header.tsx` exports `Header`).
- `"use client"` is opt-in, not the default. Keep components as server
  components unless they genuinely need interactivity, hooks, or browser
  APIs. Currently client: `AppShell`, `Header`, `Quiz`, `BreedShowcase`,
  `CookieConsent`, `SignupForm` — each needs local state, `useRouter`, or a
  browser-only API (`localStorage`, `setInterval`, etc.). Everything else
  (`Footer`, `Landing`, `HowItWorks`, `BreedCard`, `AnswersRecap`,
  `LegalPage`, `Results`, `ArticleCard`, `GuidesPreview`, `ArticleBody`) is a
  plain server component. Before adding
  `"use client"` to something, check whether the interactivity can live in a
  smaller child component instead of the whole tree.
- Reuse the shared `LegalPage` layout component for any new static/standalone
  page that should share the site's header/footer chrome — don't hand-roll
  the `<Header>`/`<Footer>` wiring again (see `docs/architecture.md` for why
  this matters for the "Start the quiz" button specifically).

## Backend: Supabase (newsletter, breeds, articles)

Four features talk to Supabase; everything else stays client-side.

- **Newsletter:** the form (`SignupForm`) inserts the subscriber's name + email
  into the `newsletter_subscribers` table via `subscribeToNewsletter` in
  `src/lib/newsletter.ts` (a direct REST call — no client library).
- **Breeds:** `getBreeds()` in `src/lib/getBreeds.ts` reads the breed catalog
  from the Supabase `breeds` table — the single source of truth, with no
  bundled data. If Supabase isn't configured or is unreachable it returns an
  empty list and the pages show an empty state. Breeds are fetched in Server
  Components (`src/app/page.tsx`, `src/app/breeds/page.tsx`) and passed down as
  props — client components never fetch them.
- **Articles** ("Paws & Pointers", `/guides`): `getArticles()` in
  `src/lib/getArticles.ts` reads the catalog — including each article's
  markdown `body` — from the Supabase `articles` table, the same
  fetch-and-map shape as breeds. `src/components/ArticleBody.tsx` renders that
  markdown with `react-markdown` + `remark-gfm` (table support), mapped to the
  design system's styling rather than react-markdown's bare HTML. `/guides`
  and `/guides/[slug]` fetch directly; the homepage teaser
  (`GuidesPreview`) receives articles as a prop threaded through
  `page.tsx` → `AppShell` → `Landing`, exactly like breeds — an async
  Server Component can't be nested inside `AppShell`'s `"use client"`
  boundary, so the fetch has to happen above it.
- **Admin auth:** Google sign-in gating `/admin`, via Supabase Auth. This is the
  **one deliberate exception** to the raw-fetch, no-client-library rule: it uses
  `@supabase/ssr` (+ `@supabase/supabase-js`) because OAuth/PKCE + cookie
  sessions are the "don't hand-roll security" case. The exception is scoped to
  auth only (`src/lib/supabase/server.ts`, `src/lib/auth/**`, `src/proxy.ts`,
  `src/app/auth/callback/`) — the newsletter, breeds, and articles data layers
  stay on raw `fetch`. See `docs/architecture.md` → "Admin authentication" for
  the full design. Needs `ADMIN_ALLOWED_EMAILS` in addition to the Supabase
  env vars.

Both breeds and articles are also fully manageable from `/admin` (create,
edit, delete) — see `src/lib/admin/breeds.ts` / `articles.ts` and
`src/components/admin/BreedForm.tsx` / `ArticleForm.tsx`. Admin writes use the
service-role key (bypasses RLS; never exposed to the browser — see
`src/lib/admin/http.ts`), while the public site reads with the anon key under
RLS. An article added or edited in `/admin/articles` appears on the public
site within the hour (the `getArticles()` cache window), or immediately if the
edit went through a Server Action, since every admin write action calls
`revalidatePath` on the affected public routes.

All Supabase-backed data needs `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`); the tables + row-level
security live in `supabase/schema.sql`, and the data model is documented in
`docs/data-model.md`.

Beyond those, the site stays deliberately backend-free: no API routes and no
email service. There is now **one authorized persistence exception**:
signed-in users can save quiz results to the `saved_results` table (per-user,
RLS-scoped — see `docs/data-model.md`). That aside, quiz answers and match
results are computed and kept entirely in the browser and are never sent
anywhere for anonymous visitors — keep it that way. Don't add *further*
persistence or API calls unless explicitly asked; treat this as an intentional
scope boundary, not an unfinished stub.

## Assets

- Real photos and generated images live in `public/`; sticker cutouts
  (background-removed PNGs) live in `public/stickers/`.
- Existing photo filenames are just camera-roll names (e.g.
  `IMG_27872.jpeg`) and aren't semantic — that's legacy, not a pattern to
  copy. Name any new asset descriptively in kebab-case
  (`hero-dog-photo.jpg`, `shih-tzu-sticker.png`).
- Before adding a new image, check whether it needs `next/image`'s `priority`
  prop — only set it for content that's actually visible above the fold at
  load time. Setting `priority` on an image forces the browser to fetch it
  immediately regardless of whether CSS is hiding it (this caused a real bug:
  the hero photo was downloading on mobile even though it's hidden there via
  `hidden sm:flex` — fixed by dropping `priority`).

## Accessibility baseline (already fixed once — don't regress)

- Text/background color pairs must maintain at least 4.5:1 contrast. See the
  pairing table and rules in `docs/design-system.md` before changing any
  color token or adding new colored text/buttons.
- Elements that are visually hidden (via CSS opacity/`display:none`) but not
  removed from the DOM must also be taken out of the tab order — use the
  native `inert` attribute (see `CookieConsent.tsx`) rather than relying on
  `aria-hidden` or `pointer-events-none` alone, which don't affect keyboard
  focus.
- Toasts/confirmation messages that should be announced to screen readers
  need their text content to actually appear/disappear in the DOM at the
  moment of the event — a live region (`aria-live`) whose text is static from
  initial render and only gets CSS-toggled visible is not reliably announced.
  See the pattern in `SignupForm.tsx`.
- Auto-updating content (carousels, rotators) needs an explicit, tap-friendly
  pause control, and should not use `aria-live` on the auto-changing region
  (that forces an announcement on every automatic change, which is
  disruptive). See `BreedShowcase.tsx`.
