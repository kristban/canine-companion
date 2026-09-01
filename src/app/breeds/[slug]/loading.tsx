import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Matches breeds/[slug]/page.tsx's chrome (see breeds/loading.tsx for why
// Header/SignupForm/Footer are rendered for real, not skeletons).
export default function BreedLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <Skeleton className="h-4 w-24" />

          <div className="mt-6 flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>

            <Skeleton className="h-14 w-56 self-start rounded-full" />
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
