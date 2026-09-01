import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Matches u/[username]/page.tsx's chrome (see breeds/loading.tsx for why
// Header/SignupForm/Footer are rendered for real, not skeletons).
export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-6 rounded-3xl border-3 border-border bg-surface p-8 text-center shadow-hard">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-2/3 max-w-md" />
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
