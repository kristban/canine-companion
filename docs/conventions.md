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

## No backend — this is deliberate

There is no database, no API routes, no email service, and no persistence
beyond `localStorage` (used only for the cookie-consent choice). The
newsletter form (`SignupForm`) does client-side-only validation and simulates
success — it does not send data anywhere. Don't add persistence, API calls,
or "wire this up for real" unless explicitly asked; treat the current
behavior as an intentional scope boundary, not an unfinished stub.

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
