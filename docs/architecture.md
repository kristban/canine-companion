# Architecture

Canine Companion is a single-product Next.js App Router site: a dog-breed-matching
quiz. Supabase is the backend: it stores newsletter signups and serves the
breed catalog (the quiz itself runs entirely in the browser). See
`conventions.md` for what that means in practice.

## Two navigation models coexist

**1. The main app lives entirely on `/` and uses client state, not routes.**
`AppShell` (`src/components/AppShell.tsx`) owns a `view` state
(`"landing" | "quiz" | "results"`) and swaps between `Landing`, `Quiz`, and
`Results` without ever changing the URL. Quiz answers and results live only in
React state — nothing is persisted, so a refresh resets progress.

**2. Everything else is a real route with its own page chrome.**
`/privacy`, `/cookies`, `/terms` (all rendered through the shared `LegalPage`
layout component), the `/breeds` gallery, the `/guides` articles section
(listing page + `/guides/[slug]` article pages), and the 404 page
(`src/app/not-found.tsx`) are independent routes. They are *not* part of
`AppShell` — each renders its own `<Header />` and `<Footer />` directly.
(`/breeds`, `/guides`, and the 404 page are hand-rolled rather than routed
through `LegalPage`, because their content isn't legal prose — see the Header
gotcha below.)

## The Header gotcha

`Header` takes optional `onLogoClick` / `onStart` callbacks:

- `AppShell` passes explicit handlers that just flip its local `view` state.
- Standalone pages render `<Header />` with no props, so `Header` falls back to
  `router.push("/?start=quiz")`. `AppShell` reads that query param in a
  `useEffect` on mount, jumps straight to the quiz view, then cleans the URL
  back to `/`.

This two-path setup is easy to break silently (it already caused a real bug:
"Start the quiz" from a legal page just opened the homepage instead of the
quiz). **When adding a new standalone page, prefer the `LegalPage` wrapper. If
its legal-prose layout doesn't fit (as with the `/breeds` gallery and the 404
page), hand-roll the chrome the way they do — render `<Header />` with no props
so the `/?start=quiz` fallback keeps working. Never render `Header` outside of
`AppShell` without accounting for this fallback.**

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
├── "/" → page.tsx (server: getBreeds) → AppShell (client, owns view state)
│   ├── Header
│   ├── Landing | Quiz | Results   (one at a time, by view state)
│   ├── SignupForm
│   └── Footer
├── "/privacy" | "/cookies" | "/terms" → LegalPage
│   ├── Header
│   ├── (page-specific content)
│   ├── SignupForm
│   └── Footer
├── "/breeds" → BreedsPage (server: getBreeds; hand-rolled, like LegalPage)
│   ├── Header
│   ├── (breed card grid)
│   ├── SignupForm
│   └── Footer
├── "/guides" → GuidesPage (server; hand-rolled, like BreedsPage)
│   ├── Header
│   ├── (article cards, grouped by category)
│   ├── SignupForm
│   └── Footer
├── "/guides/[slug]" → ArticlePage (server; hand-rolled, like GuidesPage)
│   ├── Header
│   ├── (article header + dynamically-imported .mdx body)
│   ├── SignupForm
│   └── Footer
├── not-found (404) → same shape as LegalPage, hand-rolled
└── CookieConsent (rendered globally in RootLayout, outside AppShell)
```

### The `/guides/[slug]` MDX pipeline

Article bodies are `.mdx` files in `src/content/advice/`, not routes under
`src/app/` — `src/app/guides/[slug]/page.tsx` dynamically imports the file
matching the requested slug (`import(`@/content/advice/${slug}.mdx`)`), the
pattern Next.js's own MDX guide documents for content collections
(`node_modules/next/dist/docs/01-app/02-guides/mdx.md`). `generateStaticParams`
+ `dynamicParams = false` mean only slugs already listed in
`src/lib/articles.ts` resolve; anything else 404s before the import is even
attempted.

`@next/mdx` (configured in `next.config.ts`) enables the `.mdx` import itself;
it does **not** parse YAML frontmatter, which is why each article's metadata
is a plain `export const metadata = {...}` object at the top of the file
instead. `src/mdx-components.tsx` maps markdown output (headings, tables,
blockquotes, links, lists) to the site's design-system tokens — see
`docs/conventions.md` for how to add a new article.

## Admin authentication (Google sign-in gate)

`/admin` is gated by **Google sign-in via Supabase Auth**, restricted to an
email allowlist. Access is enforced at three layers (the service-role data
layer bypasses RLS, so the DB can't be the boundary — the app is):

1. **`src/proxy.ts`** — the Next.js 16 *proxy* (the renamed `middleware`
   convention; `middleware.ts` no longer exists in Next 16, and proxy runs on
   the Node.js runtime). Matches `/admin/:path*`, refreshes the Supabase session
   cookie, and redirects anyone who isn't a signed-in allowlisted admin to
   `/admin/login` — with `?error=not_allowed` when they *are* signed in but off
   the allowlist, or `?redirectTo=…` when signed out (and sends already-signed-in
   admins off the login page to `/admin`). This is the page-navigation gate.
2. **`src/app/admin/(protected)/layout.tsx`** — calls `requireAdmin()` on render.
   The protected admin pages live in the `(protected)` route group so this
   guard can redirect without looping; the sibling `/admin/login` route is
   *outside* the group (and so is the only `/admin/*` page the proxy lets
   through unauthenticated). Route groups don't change URLs — everything is
   still at `/admin/...`.
3. **Every admin Server Action** (`src/lib/admin/actions.ts`) re-checks with
   `await requireAdmin()`. This is **mandatory, not just defense-in-depth**: a
   proxy `matcher` exclusion also skips the proxy for Server Action POSTs, so
   the action must verify auth itself.

Supporting pieces: `src/app/auth/callback/route.ts` (the **shared** OAuth
callback — exchanges the code for a session and redirects to `next`; it does
*not* enforce the allowlist, since admin is gated by the three layers above and
ordinary public users must be allowed to hold a session), `src/lib/auth/
requireAdmin.ts` (`getAdminUser()` / `requireAdmin()` — allowlist check layered
on `getSessionUser()`), `src/lib/auth/allowlist.ts` (parses
`ADMIN_ALLOWED_EMAILS`, fails closed), `src/lib/auth/actions.ts` (admin
sign-in/out Server Actions), and `src/lib/supabase/server.ts` (the anon-key auth
client + `getSessionUser` in `src/lib/auth/requireUser.ts`). Google's OAuth
Client ID/Secret live in the Supabase dashboard, not in app env; the app needs
the Supabase URL/anon key plus `ADMIN_ALLOWED_EMAILS`.

## Public authentication (Google login for visitors)

Separate from the admin gate: any visitor can sign in with Google. **The quiz is
fully usable logged-out** — login is required only to *save* results. Auth here
is a display/convenience layer, not a wall.

- **`src/components/SessionProvider.tsx`** wraps the app in `RootLayout` and
  holds the current user. It hydrates **client-side** (`getSession()` +
  `onAuthStateChange`) via the browser client (`src/lib/supabase/client.ts`) —
  deliberately *not* from a server cookie read, so the static pages (`/`,
  `/breeds`, `/privacy`, …) stay static. `useSession()` exposes `{ user, loading }`.
- **`src/components/AuthNav.tsx`** (in `Header`) is the nav control: logged out →
  "Continue with Google"; logged in → a name-chip menu (My results, Account, Log
  out). Sign-in/out run through the browser client.
- **Per-user pages** `/account` and `/results` are real routes with hand-rolled
  chrome; each calls `requireUser()` (`src/lib/auth/requireUser.ts`), which
  redirects signed-out visitors to **`/login`** (the public, allowlist-free login
  page). Data is read/written with the *user's* session under RLS — never the
  service-role key.
- **Save-across-redirect:** quiz results live only in `AppShell` React state.
  When a signed-out user clicks "Save these results", the results are stashed in
  `sessionStorage` (`src/lib/results.ts`) and OAuth returns to `/?savePending=1`;
  `AppShell`'s mount effect rehydrates them so the save can complete. Signed-in,
  the save inserts a snapshot into `saved_results` directly (see
  `docs/data-model.md`).
