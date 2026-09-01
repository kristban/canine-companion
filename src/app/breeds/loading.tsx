import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

// Matches breeds/page.tsx's chrome exactly (real Header/SignupForm/Footer —
// none of them depend on this route's data) so only the breed grid area
// swaps in once getBreeds() resolves. See docs/architecture.md's Header
// gotcha: <Header /> with no props for the /?start=quiz fallback.
export default function BreedsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <Skeleton className="h-5 w-3/4 max-w-xl" />
            <Skeleton className="mt-4 h-14 w-48 rounded-full" />
          </div>

          <Skeleton className="mx-auto mt-10 h-14 w-full max-w-md rounded-full" />

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
