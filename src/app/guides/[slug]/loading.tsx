import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Matches guides/[slug]/page.tsx's chrome (see breeds/loading.tsx for why
// Header/SignupForm/Footer are rendered for real, not skeletons).
export default function ArticleLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <Skeleton className="h-4 w-24" />

          <div className="mt-6 flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-full max-w-lg" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
