import { MatchResult } from "@/lib/match";

interface BreedCardProps {
  result: MatchResult;
  rank: number;
}

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export function BreedCard({ result, rank }: BreedCardProps) {
  const { breed, matchPercent } = result;

  return (
    <article className="transition-smooth flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:items-center">
      <div className="flex items-center gap-4 sm:w-56 sm:flex-col sm:items-start sm:gap-2">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl"
          aria-hidden="true"
        >
          {breed.emoji}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">
            {RANK_BADGES[rank] ?? `#${rank + 1}`} match
          </p>
          <h3 className="text-xl font-extrabold tracking-tight text-text">
            {breed.name}
          </h3>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 flex items-center gap-3">
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={matchPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${breed.name} match percentage`}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-accent"
              style={{ width: `${matchPercent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-primary">
            {matchPercent}%
          </span>
        </div>
        <p className="text-sm font-semibold text-secondary">{breed.tagline}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {breed.description}
        </p>
      </div>
    </article>
  );
}
