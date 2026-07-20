# Data & matching logic

All quiz/breed logic lives in `src/lib/` and is pure data + pure functions —
no fetching, no backend. Everything is computed client-side at quiz-completion
time in `AppShell.handleComplete`.

## `src/lib/breeds.ts`

`Breed` is a static list (~19 breeds). Every breed scores 12 traits on a 1–5
scale (1 = very low, 5 = very high): `energy`, `grooming`, `trainability`,
`goodWithKids`, `goodWithOtherPets`, `apartmentFriendly`, `independence`,
`noviceFriendly`, `vocal`, `runningPartner`, `heatTolerance`, `coldTolerance`.
Each breed also has a `size: "small" | "medium" | "large"`.

**To add a breed:** add an entry to the `breeds` array with all 12 trait
fields plus `id`, `name`, `emoji`, `tagline`, `description`, `size`. There's
no validation — a missing field is a silent `undefined` in scoring.

## `src/lib/questions.ts`

`questions` is an ordered array of `QuizQuestion`, each with 2–4 `QuizOption`s.
Every option carries `contributions: TraitContribution[]` — the thing that
actually affects matching. A `TraitContribution` is:

```ts
{ trait: Trait, target: number, mode: "min" | "max" | "match", weight: number }
```

- `mode: "min"` — breed's trait value should be **at least** `target`; only
  penalized if it falls short (e.g. picking "young kids" wants
  `goodWithKids >= 5`).
- `mode: "max"` — breed's trait value should be **at most** `target`; only
  penalized if it exceeds it (e.g. picking "minimal grooming" wants
  `grooming <= 2`).
- `mode: "match"` — breed's trait value should be **close to** `target` in
  either direction (used for things like desired energy level).
- `weight` scales how much that contribution matters relative to others.

An option can have an empty `contributions: []` array — that's the neutral/
"no strong preference" choice on several questions.

The size question is special: options set `sizePreference: Size[]` instead of
(or alongside) `contributions`; this feeds a flat penalty in the matcher
rather than a per-trait one.

**To add a question:** append to `questions`, give each option realistic
`contributions` using existing `Trait` names — no new trait can be introduced
without also adding it to every breed in `breeds.ts`.

## `src/lib/match.ts`

`matchBreeds(answers)`:

1. Sums `weight * 4` (max possible per-contribution penalty) across every
   answered contribution to get `maxPossiblePenalty`, plus a flat
   `SIZE_MISMATCH_PENALTY` (5) if any size preference was given.
2. For every breed, sums the actual penalty across all contributions
   (per the min/max/match rules above), plus the size penalty if the breed's
   size isn't in the selected `sizePreference` set.
3. Converts penalty into `matchPercent = 100 * (1 - penalty / maxPossiblePenalty)`,
   clamped to 0–100 and rounded.
4. Returns all breeds sorted by `matchPercent` descending.

`Results.tsx` shows the top 5. There's no tie-breaking beyond stable array sort.
