import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Canine Companion",
  description:
    "How Canine Companion handles your information when you use the dog breed quiz.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 16, 2026">
      <section>
        <h2>Overview</h2>
        <p>
          Canine Companion is a free dog breed matching quiz. There are no
          accounts, no sign-ups, and no server-side database — your quiz
          answers and results are calculated and stored entirely in your own
          browser and are never transmitted to us or anyone else.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>
          We do not collect personal information through the quiz itself. The
          only data saved on your device is:
        </p>
        <ul>
          <li>
            Your cookie consent choice (accepted or declined), stored in your
            browser&apos;s local storage.
          </li>
          <li>
            Your in-progress quiz answers, kept temporarily in memory while
            you use the site and cleared when you close the tab.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies and tracking</h2>
        <p>
          We don&apos;t use analytics, advertising, or third-party tracking
          cookies. See our{" "}
          <a
            href="/cookies"
            className="font-semibold text-primary underline underline-offset-2 hover:text-secondary"
          >
            Cookie Policy
          </a>{" "}
          for full details on what&apos;s stored locally and why.
        </p>
      </section>

      <section>
        <h2>Children&apos;s privacy</h2>
        <p>
          Canine Companion is not directed at children under 13, and we do
          not knowingly collect information from anyone regardless of age.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, we&apos;ll update the date at the top of
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
