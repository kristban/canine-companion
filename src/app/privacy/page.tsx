import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Canine Companion",
  description:
    "How Canine Companion handles your information: the quiz runs entirely in your browser, plus what we collect if you sign in with Google, save results, or sign up for the newsletter.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 1, 2026">
      <section>
        <h2>Overview</h2>
        <p>
          Canine Companion is a free dog breed matching quiz. You can take the
          whole quiz without an account and without giving us any personal
          information: your answers and results are calculated in your own
          browser and are never transmitted to us unless you choose one of the
          optional features below.
        </p>
        <p>
          Personal information is only ever involved if you choose to: sign up
          for our newsletter, sign in with Google to save your results, or set
          up a public profile. Each is entirely optional, and everything below
          explains what we collect, why, and how to have it removed.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>
          Through the quiz itself, we collect no personal information. The only
          data kept on your device is your cookie consent choice, your theme
          (light/dark) preference, and your in-progress quiz answers — all
          explained in our{" "}
          <a
            href="/cookies"
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            Cookie Policy
          </a>
          .
        </p>
        <p>If you use one of the optional features, we additionally collect:</p>
        <ul>
          <li>
            <strong>Newsletter:</strong> the name and email address you enter
            in the sign-up form.
          </li>
          <li>
            <strong>Google sign-in:</strong> the name, email address, and
            profile photo Google shares with us when you sign in, plus a
            session cookie that keeps you signed in.
          </li>
          <li>
            <strong>Saved quiz results:</strong> if you&apos;re signed in and
            choose to save a result, we store a snapshot of your top matches
            and quiz answers, tied to your account.
          </li>
          <li>
            <strong>Public profile:</strong> if you set up a profile, the
            username, display name, avatar, and bio you choose to add.
          </li>
        </ul>
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
        <h2>Signing in with Google</h2>
        <p>
          Signing in is optional and only needed to save quiz results or set up
          a public profile — the quiz itself never requires an account. When
          you sign in, Google shares your name, email address, and profile
          photo with us, and we keep you signed in with a session cookie (see
          our{" "}
          <a
            href="/cookies"
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            Cookie Policy
          </a>
          ). This data is stored with Supabase, our infrastructure provider,
          and is never sold or shared with anyone else.
        </p>
      </section>

      <section>
        <h2>Saved quiz results</h2>
        <p>
          If you&apos;re signed in, you can save a quiz result — we store a
          snapshot of your top matches and the answers that produced them.
          Only you can see or delete your saved results (via{" "}
          <a
            href="/results"
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            /results
          </a>
          ); we don&apos;t use them for anything beyond showing them back to
          you.
        </p>
      </section>

      <section>
        <h2>Public profile</h2>
        <p>
          If you set up a profile at{" "}
          <a
            href="/account"
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            /account
          </a>
          , your username, display name, avatar, and bio are shown on a public
          page at <code>caninecompanion.app/u/&lt;username&gt;</code> — visible
          to anyone, including search engines. Only fill in what you&apos;re
          comfortable making public; every field except your username is
          optional, and you can edit or clear them at any time.
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>Every optional feature stays in your control:</p>
        <ul>
          <li>
            Edit or clear your public profile fields anytime at{" "}
            <a
              href="/account"
              className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
            >
              /account
            </a>
            .
          </li>
          <li>
            Delete individual saved results anytime at{" "}
            <a
              href="/results"
              className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
            >
              /results
            </a>
            .
          </li>
          <li>
            To unsubscribe from the newsletter, delete your account entirely
            (including your profile, saved results, and Google sign-in), or
            ask what information we hold about you, email{" "}
            <a
              href="mailto:hello@caninecompanion.app"
              className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
            >
              hello@caninecompanion.app
            </a>{" "}
            and we&apos;ll take care of it.
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
            className="font-semibold text-link underline underline-offset-2 hover:text-secondary"
          >
            Cookie Policy
          </a>{" "}
          for full details on what&apos;s stored locally and why, including
          the session cookie used to keep signed-in visitors signed in.
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
