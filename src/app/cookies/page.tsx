import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — Canine Companion",
  description:
    "What Canine Companion stores in your browser and why, and how to manage it.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="July 16, 2026">
      <section>
        <h2>What we use</h2>
        <p>
          Canine Companion uses your browser&apos;s local storage — not
          third-party tracking cookies — to remember one thing: whether
          you&apos;ve accepted or declined our cookie banner. That&apos;s it.
        </p>
      </section>

      <section>
        <h2>Strictly necessary storage</h2>
        <ul>
          <li>
            <strong>Cookie consent choice</strong> — remembers your
            accept/decline decision so we don&apos;t show the banner on every
            visit.
          </li>
        </ul>
        <p className="mt-3">
          This is considered strictly necessary storage under GDPR and
          similar regulations, since it&apos;s required to remember your own
          preference about cookies.
        </p>
      </section>

      <section>
        <h2>What we don&apos;t use</h2>
        <p>
          We don&apos;t use analytics cookies, advertising cookies, or any
          third-party tracking scripts. Your quiz answers never leave your
          browser.
        </p>
      </section>

      <section>
        <h2>Managing storage</h2>
        <p>
          You can clear this at any time through your browser&apos;s site
          settings (usually under &ldquo;Cookies and site data&rdquo; or
          &ldquo;Privacy&rdquo;). Clearing it will simply bring the consent
          banner back on your next visit.
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
            className="font-semibold text-primary underline underline-offset-2 hover:text-secondary"
          >
            hello@caninecompanion.app
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
