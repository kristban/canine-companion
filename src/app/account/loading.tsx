import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SignupForm } from "@/components/SignupForm";
import { Skeleton } from "@/components/Skeleton";

function FormCardSkeleton({ fields }: { fields: number }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-40 self-start rounded-full" />
    </div>
  );
}

// Matches account/page.tsx's chrome (see breeds/loading.tsx for why
// Header/SignupForm/Footer are rendered for real, not skeletons).
export default function AccountLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-grid-pattern bg-background">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-72" />
          </div>

          <FormCardSkeleton fields={3} />
          <FormCardSkeleton fields={1} />
        </div>
      </main>
      <SignupForm />
      <Footer />
    </div>
  );
}
