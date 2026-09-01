import Link from "next/link";
import { MatchResult } from "@/lib/match";

interface BreedCardProps {
  result: MatchResult;
  rank: number;
  /** A short sentence explaining why this breed scored the way it did. */
  reason?: string;
  /** "avoid" mutes the styling for a breed that's probably not a fit. */
  variant?: "match" | "avoid";
}

const RANK_BADGES = ["🥇", "🥈", "🥉"];
const AVATAR_COLORS = ["bg-secondary", "bg-primary/30", "bg-accent/40"];

export function BreedCard({
  result,
  rank,
  reason,
  variant = "match",
}: BreedCardProps) {
  const { breed, matchPercent } = result;
  const isAvoid = variant === "avoid";

  return (
    <article className="transition-smooth flex flex-col gap-4 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard hover:-translate-y-1 sm:flex-row sm:items-center">
      <Link
        href={`/breeds/${breed.id}`}
        className="transition-smooth flex items-center gap-4 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-56 sm:flex-col sm:items-start sm:gap-2"
      >
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-border text-4xl ${isAvoid ? "bg-background-alt" : AVATAR_COLORS[rank % AVATAR_COLORS.length]}`}
          aria-hidden="true"
        >
          {breed.emoji}
        </span>
        <div>
          <p
            className={`text-xs font-extrabold uppercase tracking-wide ${isAvoid ? "text-muted" : "text-link"}`}
          >
            {isAvoid ? "Probably not a fit" : `${RANK_BADGES[rank] ?? `#${rank + 1}`} match`}
          </p>
          <h3 className="font-display text-xl font-semibold tracking-tight text-text hover:text-link hover:underline">
            {breed.name}
          </h3>
        </div>
      </Link>

      <div className="flex-1">
        <div className="mb-2 flex items-center gap-3">
          <div
            className="h-3 flex-1 overflow-hidden rounded-full border-2 border-border bg-background-alt"
            role="progressbar"
            aria-valuenow={matchPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${breed.name} match percentage`}
          >
            <div
              className={`h-full rounded-full ${isAvoid ? "bg-muted" : "bg-primary"}`}
              style={{ width: `${matchPercent}%` }}
            />
          </div>
          <span
            className={`text-sm font-extrabold ${isAvoid ? "text-muted" : "text-link"}`}
          >
            {matchPercent}%
          </span>
        </div>
        <p className="text-sm font-bold text-text">{breed.tagline}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {breed.description}
        </p>
        {reason && (
          <p className="mt-2 text-sm leading-relaxed text-text">
            <span aria-hidden="true">{isAvoid ? "🙅 " : "💡 "}</span>
            {reason}
          </p>
        )}
      </div>
    </article>
  );
}
