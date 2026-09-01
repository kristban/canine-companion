import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import {
  BREED_GROUPS,
  TRAIT_FIELDS,
  breedGroupLabel,
  getBreedHighlights,
  getBreedStickerUrl,
} from "@/lib/breeds";
import { getBreeds } from "@/lib/getBreeds";

interface BreedPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BreedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const breeds = await getBreeds();
  const breed = breeds.find((b) => b.id === slug);
  if (!breed) {
    return {
      title: "Breed Not Found — Canine Companion",
      robots: { index: false, follow: false },
    };
  }
  const description = `${breed.tagline} See ${breed.name}'s energy, grooming, trainability, and eight other traits, then take the quiz to find out if it's your match.`;
  return {
    title: `${breed.name} — Canine Companion`,
    description,
    alternates: { canonical: `/breeds/${breed.id}` },
    openGraph: {
      title: `${breed.name} — Canine Companion`,
      description,
      url: `/breeds/${breed.id}`,
      type: "website",
    },
  };
}

// Standalone route — renders its own Header/Footer chrome (like /breeds and
// /guides/[slug]), not part of AppShell. Header gets no props, so "Start the
// quiz" falls back to /?start=quiz, which AppShell reads on mount (see
// docs/architecture.md).
//
// No generateStaticParams/dynamicParams here — deliberately fully dynamic
// (like /guides/[slug]), so a breed added via /admin/breeds appears here
// without a redeploy. See getBreeds()'s hourly revalidate.
export default async function BreedPage({ params }: BreedPageProps) {
  const { slug } = await params;
  const breeds = await getBreeds();
  const breed = breeds.find((b) => b.id === slug);
  if (!breed) notFound();

  const group = BREED_GROUPS.find((g) => g.value === breed.group);
  const highlights = getBreedHighlights(breed);
  const stickerUrl = getBreedStickerUrl(breed.id);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <Link
            href="/breeds"
            className="transition-smooth text-sm font-bold text-muted hover:text-link"
          >
            ← All breeds
          </Link>

          <div className="mt-6 flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
            {breed.imageUrl ? (
              <div className="flex w-full items-center justify-center overflow-hidden rounded-[1.75rem] border-3 border-border bg-background-alt shadow-hard-sm">
                {/* Arbitrary admin-supplied URL — not run through next/image,
                    which only allows a fixed set of remote hosts (see
                    next.config.ts). Same pattern as /u/[username].
                    object-contain (not cover) + no forced aspect ratio, so
                    portrait photos aren't cropped — breed photos vary in
                    orientation since they're admin-uploaded. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={breed.imageUrl}
                  alt={breed.name}
                  className="max-h-[28rem] w-full object-contain"
                />
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <span
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-secondary/40 text-5xl"
                aria-hidden="true"
              >
                {stickerUrl ? (
                  <Image
                    src={stickerUrl}
                    alt=""
                    width={160}
                    height={160}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  breed.emoji
                )}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                  {breed.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-accent/40 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-text">
                    <span aria-hidden="true">📏</span>
                    <span className="capitalize">{breed.size}</span>
                  </span>
                  {group && (
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-background-alt px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-text">
                      <span aria-hidden="true">{group.emoji}</span>
                      {breedGroupLabel(breed.group)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-base font-bold text-link">{breed.tagline}</p>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {breed.description}
              </p>
            </div>

            {highlights.length > 0 && (
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
                  At a glance
                </h2>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-2 text-base font-semibold text-text"
                    >
                      <span aria-hidden="true">🐾</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TRAIT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3 text-sm">
                  <dt className="flex w-40 shrink-0 items-center gap-1.5 font-semibold text-text">
                    <span aria-hidden="true">{field.icon}</span>
                    {field.label}
                  </dt>
                  <dd
                    className="h-2.5 flex-1 overflow-hidden rounded-full border-2 border-border bg-background-alt"
                    role="img"
                    aria-label={`${field.label}: ${breed[field.key]} out of 5`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(breed[field.key] / 5) * 100}%` }}
                    />
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href="/?start=quiz"
              className="transition-smooth self-start rounded-full border-2 border-border bg-primary px-8 py-4 text-lg font-bold text-white shadow-hard hover:-translate-y-1 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              See if {breed.name} is your match 🐾
            </Link>
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
