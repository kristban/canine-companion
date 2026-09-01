import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Canine Companion",
  description: "The terms that apply to using the Canine Companion quiz.",
  alternates: { canonical: "/terms" },
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="September 1, 2026">
      <section>
        <h2>Acceptance of terms</h2>
        <p>
          By using Canine Companion, you agree to these terms. If you
          don&apos;t agree, please don&apos;t use the site.
        </p>
      </section>

      <section>
        <h2>What this is</h2>
        <p>
          Canine Companion is a free, for-entertainment quiz that suggests
          dog breeds based on your answers. It&apos;s meant to be a fun
          starting point for research — not professional veterinary,
          breeding, or adoption advice, and not a guarantee of compatibility
          with any specific dog.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          Breed information and match percentages are provided &ldquo;as
          is&rdquo; for general guidance. We don&apos;t guarantee their
          accuracy or completeness, and we recommend talking to a vet,
          breeder, or shelter before bringing a dog home.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          The quiz never requires an account. Signing in with Google is
          optional and only needed to save quiz results or set up a public
          profile. You&apos;re responsible for the security of your Google
          account, and for keeping any information you provide accurate. We
          may suspend or remove an account that violates these terms.
        </p>
      </section>

      <section>
        <h2>Public profiles</h2>
        <p>
          If you set up a profile, your username, display name, avatar, and
          bio are visible to anyone who visits your profile page — don&apos;t
          include anything you&apos;d rather keep private. Don&apos;t
          impersonate another person or brand, and don&apos;t use your
          username, display name, or bio for content that&apos;s illegal,
          abusive, or infringes someone else&apos;s rights. We may remove
          profile content or suspend an account that breaks this rule, and we
          don&apos;t guarantee that any particular username stays available or
          reserved for you.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>
          You&apos;re welcome to use Canine Companion for personal,
          non-commercial purposes. Please don&apos;t attempt to disrupt the
          site, scrape it at scale, or misrepresent its content as your own.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          Canine Companion is provided free of charge, and we aren&apos;t
          liable for decisions made based on quiz results, including the
          choice to adopt or purchase a particular breed.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the State of Oregon,
          USA, without regard to conflict-of-law principles.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          If these terms change, we&apos;ll update the date at the top of
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
