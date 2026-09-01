"use client";

import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center bg-grid-pattern bg-background px-4 py-24 text-center sm:px-6">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-[45%] border-3 border-border bg-secondary/40 sm:h-40 sm:w-40">
          <span className="text-6xl sm:text-7xl" aria-hidden="true">
            🐾
          </span>
          <span
            className="absolute -right-6 -top-4 flex h-14 w-14 rotate-12 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary text-center text-[0.6rem] font-bold uppercase leading-tight text-ink shadow-hard-sm sm:-right-8"
            aria-hidden="true"
          >
            uh
            <br />
            oh
          </span>
        </div>

        <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight text-text sm:text-6xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          We hit an unexpected snag fetching that page. Give it another try,
          or head back home.
        </p>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="transition-smooth rounded-full border-2 border-border bg-primary px-8 py-4 text-lg font-bold text-white shadow-hard-sm hover:-translate-y-1 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try again
          </button>
          <a
            href="/"
            className="transition-smooth rounded-full border-2 border-border bg-surface px-8 py-4 text-lg font-bold text-text shadow-hard-sm hover:-translate-y-1 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to home
          </a>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
