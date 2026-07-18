import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Page Not Found — Canine Companion",
  description: "The page you're looking for doesn't exist or may have moved.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center bg-grid-pattern bg-background px-4 py-24 text-center sm:px-6">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[45%] border-3 border-border bg-accent/40 sm:h-40 sm:w-40">
          <span className="text-6xl sm:text-7xl" aria-hidden="true">
            🐕‍🦺
          </span>
          <span
            className="absolute -right-6 -top-4 flex h-14 w-14 rotate-12 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary text-center text-[0.6rem] font-bold uppercase leading-tight text-text shadow-hard-sm sm:-right-8"
            aria-hidden="true"
          >
            lost
            <br />
            scent
          </span>
        </div>

        <h1 className="mt-8 font-display text-6xl font-semibold tracking-tight text-text sm:text-7xl">
          4<span className="text-primary">0</span>4
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          Looks like this page ran off the trail. The page you&apos;re
          looking for doesn&apos;t exist or may have moved.
        </p>

        <Link
          href="/"
          className="transition-smooth mt-9 rounded-full border-2 border-border bg-primary px-8 py-4 text-lg font-bold text-white shadow-hard-sm hover:-translate-y-1 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to home 🐾
        </Link>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
