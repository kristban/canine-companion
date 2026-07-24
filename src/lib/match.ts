import { Breed } from "./breeds";
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
