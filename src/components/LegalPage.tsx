import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <Link
            href="/"
            className="transition-smooth text-sm font-bold text-muted hover:text-primary"
          >
            ← Back to home
          </Link>

          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Last updated {updated}
          </p>

          <div className="mt-8 flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:text-muted [&_li]:mt-1">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
