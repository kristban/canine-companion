import { Breed, Size } from "./breeds";
import { QuizOption, Trait } from "./questions";

const SIZE_MISMATCH_PENALTY = 5;

export interface MatchResult {
  breed: Breed;
  matchPercent: number;
}

export function matchBreeds(
  answers: QuizOption[],
  breeds: Breed[],
): MatchResult[] {
  let maxPossiblePenalty = 0;
  const sizePreferences = new Set<string>();

  for (const answer of answers) {
    for (const contribution of answer.contributions) {
      maxPossiblePenalty += contribution.weight * 4;
    }
    answer.sizePreference?.forEach((size) => sizePreferences.add(size));
  }
  if (sizePreferences.size > 0) {
    maxPossiblePenalty += SIZE_MISMATCH_PENALTY;
  }

  const results = breeds.map((breed) => {
    let penalty = 0;

    for (const answer of answers) {
      for (const contribution of answer.contributions) {
        const value = breed[contribution.trait as Trait];
        if (contribution.mode === "min") {
          penalty += Math.max(0, contribution.target - value) * contribution.weight;
        } else if (contribution.mode === "max") {
          penalty += Math.max(0, value - contribution.target) * contribution.weight;
        } else {
          penalty += Math.abs(value - contribution.target) * contribution.weight;
        }
      }
    }

    if (sizePreferences.size > 0 && !sizePreferences.has(breed.size)) {
      penalty += SIZE_MISMATCH_PENALTY;
    }

    const matchPercent =
      maxPossiblePenalty === 0
        ? 100
        : Math.round(
            Math.max(0, Math.min(100, 100 * (1 - penalty / maxPossiblePenalty)))
          );

    return { breed, matchPercent };
  });

  return results.sort((a, b) => b.matchPercent - a.matchPercent);
}

// ---- Reasoning: explain why a breed did or didn't match -------------------
//
// Plain-language phrases per trait, always written as a verb phrase that
// follows the breed's name ("Labrador Retriever is great with kids"). Every
// trait is used with a single consistent mode/direction across questions.ts
// (e.g. `grooming` only ever appears with mode "max", meaning "user wants
// low grooming"), so one positive/negative phrase per trait covers every
// question that contributes to it.

const TRAIT_REASON_PHRASES: Record<Trait, { positive: string; negative: string }> = {
  energy: {
    positive: "matches the energy level you're looking for",
    negative: "doesn't match the energy level you're looking for",
  },
  grooming: {
    positive: "keeps grooming low, like you wanted",
    negative: "needs more grooming than you wanted",
  },
  trainability: {
    positive: "is easy to train",
    negative: "can be harder to train than you'd like",
  },
  goodWithKids: {
    positive: "is great with kids",
    negative: "isn't the easiest fit around kids",
  },
  goodWithOtherPets: {
    positive: "gets along well with other pets",
    negative: "may not get along well with other pets",
  },
  apartmentFriendly: {
    positive: "adapts well to smaller living spaces",
    negative: "needs more space than smaller living offers",
  },
  independence: {
    positive: "handles time alone well",
    negative: "doesn't do well left alone as much as you need",
  },
  noviceFriendly: {
    positive: "is a great fit for a first-time owner",
    negative: "does better with an experienced owner",
  },
  vocal: {
    positive: "stays fairly quiet",
    negative: "tends to bark more than you'd like",
  },
  runningPartner: {
    positive: "makes a solid running partner",
    negative: "isn't built to be a serious running partner",
  },
  heatTolerance: {
    positive: "handles heat well",
    negative: "struggles in warm weather",
  },
  coldTolerance: {
    positive: "handles cold well",
    negative: "struggles in cold weather",
  },
};

const SIZE_REASON_PHRASES = {
  positive: "is the size you're after",
  negative: "isn't the size you were hoping for",
};

interface ScoredReason {
  weight: number;
  shortfall: number; // 0 = perfect fit on this trait
  positive: string;
  negative: string;
}

export interface MatchExplanation {
  /** Up to 2 phrases describing where this breed fit well, strongest first. */
  good: string[];
  /** Up to 2 phrases describing where this breed fell short, weakest first. */
  bad: string[];
}

function joinPhrases(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Explains, in plain language, why a breed scored the way it did against the
 * user's answers. Reuses the same penalty math as `matchBreeds`, but keeps
 * only the strongest 2 and weakest 2 contributions per breed (deduped by
 * trait) instead of collapsing everything into a single percent.
 *
 * Deliberately not folded into `matchBreeds`: that function runs for every
 * breed on every quiz completion, while explanations are only ever rendered
 * for the handful of breeds actually shown (top and bottom of the sorted
 * list) — call this per displayed breed, not for the full catalog.
 */
export function explainMatch(
  breed: Breed,
  answers: QuizOption[],
): MatchExplanation {
  const scored = new Map<string, ScoredReason>();
  const sizePreferences = new Set<Size>();

  for (const answer of answers) {
    for (const contribution of answer.contributions) {
      const value = breed[contribution.trait];
      let shortfall = 0;
      if (contribution.mode === "min") {
        shortfall = Math.max(0, contribution.target - value);
      } else if (contribution.mode === "max") {
        shortfall = Math.max(0, value - contribution.target);
      } else {
        shortfall = Math.abs(value - contribution.target);
      }

      const existing = scored.get(contribution.trait);
      if (!existing || contribution.weight > existing.weight) {
        scored.set(contribution.trait, {
          weight: contribution.weight,
          shortfall,
          ...TRAIT_REASON_PHRASES[contribution.trait],
        });
      }
    }
    answer.sizePreference?.forEach((size) => sizePreferences.add(size));
  }

  if (sizePreferences.size > 0) {
    scored.set("size", {
      weight: SIZE_MISMATCH_PENALTY,
      shortfall: sizePreferences.has(breed.size) ? 0 : 1,
      ...SIZE_REASON_PHRASES,
    });
  }

  const reasons = Array.from(scored.values());

  const good = reasons
    .filter((r) => r.shortfall === 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map((r) => r.positive);

  const bad = reasons
    .filter((r) => r.shortfall > 0)
    .sort((a, b) => b.weight * b.shortfall - a.weight * a.shortfall)
    .slice(0, 2)
    .map((r) => r.negative);

  return { good, bad };
}

/** A short sentence explaining a top-recommended breed's match. */
export function summarizeGoodMatch(
  breed: Breed,
  explanation: MatchExplanation,
): string {
  const { good, bad } = explanation;
  if (good.length === 0) {
    return `${breed.name} is a solid overall fit for what you're looking for.`;
  }
  const summary = `${breed.name} ${joinPhrases(good)}`;
  return bad.length > 0 ? `${summary} — though it ${bad[0]}.` : `${summary}.`;
}

/** A short sentence explaining why a poorly-matched breed didn't work out. */
export function summarizePoorMatch(
  breed: Breed,
  explanation: MatchExplanation,
): string {
  const { good, bad } = explanation;
  if (bad.length === 0) {
    return `${breed.name} just doesn't line up with several of your other preferences.`;
  }
  const summary = `${breed.name} ${joinPhrases(bad)}`;
  return good.length > 0
    ? `${summary}, even though it ${good[0]}.`
    : `${summary}.`;
}
