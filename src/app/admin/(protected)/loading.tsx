import { Skeleton } from "@/components/Skeleton";

// Shared across every /admin/(protected) page (dashboard, breeds, articles,
// newsletter — list and detail alike). The (protected) layout renders its
// header/nav chrome for real (it's not this segment's async work — see
// requireAdmin() in layout.tsx); this only stands in for each page's own
// data fetch. Generic on purpose since one file covers very different pages.
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
