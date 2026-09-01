import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Fallback while page.tsx's getBreeds()/getArticles() resolve, before
// AppShell (and its Landing hero) mounts. Header/SignupForm/Footer are real
// components, not skeletons — AppShell renders the same ones once it takes
// over, so only the hero area swaps in. <Header /> with no props matches the
// standalone-page fallback (see docs/architecture.md's Header gotcha); once
// AppShell mounts it re-renders Header with its own view-state handlers.
export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="w-full bg-grid-pattern bg-background">
          <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
              <Skeleton className="h-11 w-full max-w-md" />
              <Skeleton className="h-11 w-3/4 max-w-sm" />
              <Skeleton className="mt-2 h-5 w-full max-w-lg" />
              <Skeleton className="h-5 w-2/3 max-w-md" />
              <Skeleton className="mt-5 h-14 w-52 rounded-full" />
            </div>
            <Skeleton className="hidden aspect-[4/3] w-full max-w-md justify-self-center sm:block" />
          </div>
        </section>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
