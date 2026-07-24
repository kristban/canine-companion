import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Canine Companion",
  description:
    "How Canine Companion handles your information: the quiz runs entirely in your browser, plus what we collect if you sign up for the newsletter.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 24, 2026">
      <section>
        <h2>Overview</h2>
        <p>
          Canine Companion is a free dog breed matching quiz. You can take the
          whole quiz without an account and without giving us any personal
          information: your answers and results are calculated and stored
          entirely in your own browser, and are never transmitted to us or
          anyone else.
        </p>
        <p>
          The one time we collect personal information is if you choose to sign
          up for our newsletter. That&apos;s entirely optional, and everything
          below explains what we collect then, why, and how to have it removed.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>
          Through the quiz itself, we collect no personal information. The only
          data kept on your device is:
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
        <p>
          If — and only if — you submit the newsletter form, we also collect
          the name and email address you enter. Unlike the data above, these
          are sent to and stored on our newsletter provider&apos;s servers, not
          just on your device.
        </p>
      </section>

      <section>
        <h2>The newsletter</h2>
        <p>
          When you sign up for our newsletter, we store the name and email
          address you provide so we can email you occasional updates about new
          breeds and features. We collect this only because you chose to give
          it to us by signing up — your sign-up is the consent.
        </p>
        <p>
          Where it&apos;s stored: newsletter sign-ups are held in a database
          hosted by Supabase, a third-party infrastructure provider that stores
          this data on our behalf. We don&apos;t sell your information or share
          it with anyone else for their own marketing.
        </p>
        <p>
          We keep your details until you ask to be removed, after which we
          delete them.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>
          Signing up is optional, and you stay in control of the information
          you give us:
        </p>
        <ul>
          <li>
            To unsubscribe or have your newsletter details deleted, email us
            at{" "}
            <a
              href="mailto:hello@caninecompanion.app"
              className="font-semibold text-primary underline underline-offset-2 hover:text-secondary"
            >
              hello@caninecompanion.app
            </a>{" "}
            and we&apos;ll remove them.
          </li>
          <li>
            You can also ask what information we hold about you, or ask us to
            correct it.
          </li>
        </ul>
        <p>
          Because the quiz stores nothing about you on our servers, these
          requests apply only to newsletter sign-ups.
        </p>
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
          Canine Companion is not directed at children under 13, and we do not
          knowingly collect personal information from children. If you believe
          a child has submitted their information through the newsletter,
          contact us and we&apos;ll delete it.
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
