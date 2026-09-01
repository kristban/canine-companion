import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Matches guides/page.tsx's chrome (see breeds/loading.tsx for why
// Header/SignupForm/Footer are rendered for real, not skeletons).
export default function GuidesLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-3/4 max-w-xl" />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
