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
  `LegalPage`, `Results`) is a plain server component. Before adding
  `"use client"` to something, check whether the interactivity can live in a
  smaller child component instead of the whole tree.
- Reuse the shared `LegalPage` layout component for any new static/standalone
  page that should share the site's header/footer chrome — don't hand-roll
  the `<Header>`/`<Footer>` wiring again (see `docs/architecture.md` for why
  this matters for the "Start the quiz" button specifically).

## Backend: Supabase (newsletter + breeds)

Two features talk to Supabase; everything else stays client-side.

- **Newsletter:** the form (`SignupForm`) inserts the subscriber's name + email
  into the `newsletter_subscribers` table via `subscribeToNewsletter` in
  `src/lib/newsletter.ts` (a direct REST call — no client library).
- **Breeds:** `getBreeds()` in `src/lib/getBreeds.ts` reads the breed catalog
  from the Supabase `breeds` table — the single source of truth, with no
  bundled data. If Supabase isn't configured or is unreachable it returns an
  empty list and the pages show an empty state. Breeds are fetched in Server
  Components (`src/app/page.tsx`, `src/app/breeds/page.tsx`) and passed down as
  props — client components never fetch them.

Both need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see
`.env.example`); the tables + row-level security live in `supabase/schema.sql`,
and the data model is documented in `docs/data-model.md`.

Everything else stays deliberately backend-free: no API routes, no email
service, and no persistence beyond `localStorage` (the cookie-consent choice).
Quiz answers and match results are computed and kept entirely in the browser
and are never sent anywhere — keep it that way. Don't add further persistence
or API calls unless explicitly asked; treat this as an intentional scope
boundary, not an unfinished stub.

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
