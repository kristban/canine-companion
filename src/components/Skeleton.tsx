// Pulsing placeholder block for route-level `loading.tsx` files. Uses
// `border-border`/`bg-border` (not `bg-surface`) so it reads as a distinct
// "not loaded yet" state in both themes — those tokens already flip between
// near-black and near-white in `.dark` (see globals.css), so this needs no
// dark-mode variant of its own. `aria-hidden` because it conveys no
// information a screen reader needs beyond the route change already in
// progress.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl border-3 border-border/15 bg-border/10 ${className}`}
    />
  );
}
