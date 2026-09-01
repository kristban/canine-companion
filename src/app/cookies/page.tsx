import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — Canine Companion",
  description:
    "What Canine Companion stores in your browser and why, and how to manage it.",
  alternates: { canonical: "/cookies" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="September 1, 2026">
      <section>
        <h2>What we use</h2>
        <p>
          Canine Companion uses your browser&apos;s local storage and, if you
          sign in, a session cookie — not third-party tracking cookies or
          scripts. Everything we store is listed below.
        </p>
      </section>

      <section>
        <h2>Strictly necessary storage</h2>
        <ul>
          <li>
            <strong>Cookie consent choice</strong> (local storage) —
            remembers your accept/decline decision so we don&apos;t show the
            banner on every visit.
          </li>
          <li>
            <strong>Sign-in session</strong> (cookie) — set only if you sign
            in with Google, this keeps you signed in between visits so you can
            save results or edit your profile. Nothing is set if you never
            sign in.
          </li>
        </ul>
        <p className="mt-3">
          This is considered strictly necessary storage under GDPR and
          similar regulations, since each item is required either to remember
          your own preference about cookies or to keep a feature you opted
          into (staying signed in) working.
        </p>
      </section>

      <section>
        <h2>Preference and functional storage</h2>
        <ul>
          <li>
            <strong>Theme preference</strong> (local storage) — remembers
            whether you chose light or dark mode.
          </li>
          <li>
            <strong>In-progress quiz answers</strong> (session storage) —
            lets you refresh the page or come back after signing in without
            losing your progress. Cleared when you finish or restart the quiz,
            and when you close the tab.
          </li>
        </ul>
      </section>

      <section>
        <h2>What we don&apos;t use</h2>
        <p>
          We don&apos;t use analytics cookies, advertising cookies, or any
          third-party tracking scripts. Your quiz answers never leave your
          browser unless you sign in and choose to save a result (see our{" "}
          <a
            href="/privacy"
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            Privacy Policy
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>Managing storage</h2>
        <p>
          You can clear any of this at any time through your browser&apos;s
          site settings (usually under &ldquo;Cookies and site data&rdquo; or
          &ldquo;Privacy&rdquo;). Clearing it will bring the consent banner
          back and, if you were signed in, sign you out.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If what we store changes, we&apos;ll update the date at the top of
          this page.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions? Reach us at{" "}
          <a
            href="mailto:hello@caninecompanion.app"
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            hello@caninecompanion.app
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
