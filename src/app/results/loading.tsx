import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Matches results/page.tsx's chrome (see breeds/loading.tsx for why
// Header/SignupForm/Footer are rendered for real, not skeletons).
export default function ResultsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-col gap-3">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-5 w-80" />
          </div>

          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
