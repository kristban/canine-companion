# Architecture

Canine Companion is a single-product Next.js App Router site: a dog-breed-matching
quiz. There is no backend — see `conventions.md` for what that means in practice.

## Two navigation models coexist

**1. The main app lives entirely on `/` and uses client state, not routes.**
`AppShell` (`src/components/AppShell.tsx`) owns a `view` state
(`"landing" | "quiz" | "results"`) and swaps between `Landing`, `Quiz`, and
`Results` without ever changing the URL. Quiz answers and results live only in
React state — nothing is persisted, so a refresh resets progress.

**2. Everything else is a real route with its own page chrome.**
`/privacy`, `/cookies`, `/terms` (all rendered through the shared `LegalPage`
layout component) and the 404 page (`src/app/not-found.tsx`) are independent
routes. They are *not* part of `AppShell` — each renders its own `<Header />`
and `<Footer />` directly.

## The Header gotcha

`Header` takes optional `onLogoClick` / `onStart` callbacks:

- `AppShell` passes explicit handlers that just flip its local `view` state.
- Standalone pages render `<Header />` with no props, so `Header` falls back to
  `router.push("/?start=quiz")`. `AppShell` reads that query param in a
  `useEffect` on mount, jumps straight to the quiz view, then cleans the URL
  back to `/`.

This two-path setup is easy to break silently (it already caused a real bug:
"Start the quiz" from a legal page just opened the homepage instead of the
quiz). **When adding a new standalone page, reuse the `LegalPage` wrapper —
don't hand-roll a page that renders `Header` outside of `AppShell` without
accounting for this fallback.**

## Anchor links across pages

A few sections need to be linkable from anywhere:

- `#signup-heading` (the newsletter form) is rendered on *every* page via
  `SignupForm`, so links to it are relative: `href="#signup-heading"`.
- `#how-it-works-heading` and `#breed-showcase-heading` only exist on the
  homepage's `Landing` tree, so links to them from anywhere (including from
  standalone pages) use an absolute path: `href="/#how-it-works-heading"`.
- Every such anchor target carries a `scroll-mt-24` class so it doesn't land
  hidden underneath the sticky header when scrolled to.

If you add a new anchor-linked section, decide up front whether it's
homepage-only or global, and match the `href` style above.

## Component tree

```
RootLayout (src/app/layout.tsx)
├── "/" → AppShell (client, owns view state)
│   ├── Header
│   ├── Landing | Quiz | Results   (one at a time, by view state)
│   ├── SignupForm
│   └── Footer
├── "/privacy" | "/cookies" | "/terms" → LegalPage
│   ├── Header
│   ├── (page-specific content)
│   ├── SignupForm
│   └── Footer
├── not-found (404) → same shape as LegalPage, hand-rolled
└── CookieConsent (rendered globally in RootLayout, outside AppShell)
```
