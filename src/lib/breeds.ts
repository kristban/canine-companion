// The `Breed` domain type. The breed catalog itself lives in the Supabase
// `breeds` table and is loaded via `getBreeds()` (src/lib/getBreeds.ts) — there
// is no bundled breed data. See docs/data-model.md and supabase/schema.sql.

export type Size = "small" | "medium" | "large";

/**
 * The group a breed belongs to, based on what it was originally bred to do.
 * Every breed belongs to exactly one. This is a browsing/organisation aid only
 * — it is deliberately NOT used by the matcher (`src/lib/match.ts`), which
 * scores the 12 numeric traits + size directly (a group is just a fuzzy proxy
 * for traits we already measure more precisely).
 *
 * This follows the Irish Kennel Club / UK Kennel Club seven-group system
 * (not the AKC's) since it matches what people see on Irish breeder listings
 * and rescue sites. Notable differences from AKC groups: "Gundog" is AKC's
 * "Sporting", "Pastoral" is AKC's "Herding", and there is no "Companion"
 * group — non-sporting companion breeds (Dalmatian, both Bulldogs, every
 * Poodle size, Boston Terrier, etc.) fall under "Utility" instead.
 */
export type BreedGroup =
  | "gundog"
  | "hound"
  | "working"
  | "terrier"
  | "pastoral"
  | "toy"
  | "utility";

/**
 * The groups in the order sections should appear (e.g. on the `/breeds`
 * gallery). `label` is the user-facing name, `emoji` is a decorative sticker
 * for section headers, and `blurb` is a one-line description of the group.
 * `utility` is the catch-all for breeds bred primarily for company or
 * historic non-sporting roles rather than a specific working job.
 */
export const BREED_GROUPS = [
  {
    value: "gundog",
    label: "Gundog",
    emoji: "🦆",
    blurb: "Athletic retrievers, pointers, and setters, happiest with a job to do.",
  },
  {
    value: "hound",
    label: "Hound",
    emoji: "👃",
    blurb: "Scent- and sight-hunters led by nose and instinct.",
  },
  {
    value: "working",
    label: "Working",
    emoji: "🛠️",
    blurb: "Powerful guardians and haulers bred for serious jobs.",
  },
  {
    value: "terrier",
    label: "Terrier",
    emoji: "🦊",
    blurb: "Feisty, tenacious ratters with outsized personalities.",
  },
  {
    value: "pastoral",
    label: "Pastoral",
    emoji: "🐑",
    blurb: "Brilliant, tireless dogs bred to herd and guard livestock.",
  },
  {
    value: "toy",
    label: "Toy",
    emoji: "🧸",
    blurb: "Small-but-mighty companions built for lap life.",
  },
  {
    value: "utility",
    label: "Utility",
    emoji: "🛋️",
    blurb: "A varied catch-all of companions and guardians that don't fit elsewhere.",
  },
] as const satisfies ReadonlyArray<{
  value: BreedGroup;
  label: string;
  emoji: string;
  blurb: string;
}>;

/** User-facing label for a group value (e.g. "gundog" -> "Gundog"). */
export function breedGroupLabel(group: BreedGroup): string {
  return BREED_GROUPS.find((g) => g.value === group)?.label ?? group;
}

export interface Breed {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  /** Optional photo URL for the public breed detail page; null falls back to the emoji. */
  imageUrl: string | null;
  size: Size;
  group: BreedGroup;
  /** 1 = very low, 5 = very high */
  energy: number;
  grooming: number;
  trainability: number;
  goodWithKids: number;
  goodWithOtherPets: number;
  apartmentFriendly: number;
  independence: number;
  noviceFriendly: number;
  vocal: number;
  /** Suitability as a jogging/running companion, independent of general energy */
  runningPartner: number;
  heatTolerance: number;
  coldTolerance: number;
}

/**
 * The 12 scored traits, in display order, with a label + icon. Drives the
 * admin breed form's numeric inputs and the trait bars on both the admin
 * breed detail page and the public `/breeds/[slug]` page.
 */
export const TRAIT_FIELDS = [
  { key: "energy", label: "Energy", icon: "⚡" },
  { key: "grooming", label: "Grooming", icon: "✂️" },
  { key: "trainability", label: "Trainability", icon: "🎓" },
  { key: "goodWithKids", label: "Good with kids", icon: "🧒" },
  { key: "goodWithOtherPets", label: "Good with other pets", icon: "🐈" },
  { key: "apartmentFriendly", label: "Apartment friendly", icon: "🏢" },
  { key: "independence", label: "Independence", icon: "🦴" },
  { key: "noviceFriendly", label: "Novice friendly", icon: "🌱" },
  { key: "vocal", label: "Vocal", icon: "🔊" },
  { key: "runningPartner", label: "Running partner", icon: "🏃" },
  { key: "heatTolerance", label: "Heat tolerance", icon: "☀️" },
  { key: "coldTolerance", label: "Cold tolerance", icon: "❄️" },
] as const satisfies ReadonlyArray<{
  key: keyof Breed;
  label: string;
  icon: string;
}>;

export type TraitKey = (typeof TRAIT_FIELDS)[number]["key"];

export const TRAIT_KEYS: readonly TraitKey[] = TRAIT_FIELDS.map((f) => f.key);

/**
 * Plain-language description of a trait at each extreme, used by
 * `getBreedHighlights` for the "At a glance" summary on the public breed
 * detail page. Deliberately neutral/descriptive rather than good-vs-bad
 * (unlike `TRAIT_REASON_PHRASES` in `match.ts`, which judges a trait against a
 * *user's* stated preference) — a standalone breed page has no quiz answers
 * to judge against.
 */
const TRAIT_HIGHLIGHT_PHRASES: Record<TraitKey, { high: string; low: string }> = {
  energy: {
    high: "Needs plenty of daily exercise",
    low: "Content with a relaxed pace",
  },
  grooming: {
    high: "Needs regular grooming to stay comfortable",
    low: "Easy, low-maintenance coat care",
  },
  trainability: {
    high: "Picks up training quickly",
    low: "Training takes patience and consistency",
  },
  goodWithKids: {
    high: "Great around kids",
    low: "Better suited to homes without young kids",
  },
  goodWithOtherPets: {
    high: "Gets along well with other pets",
    low: "May need careful introductions to other pets",
  },
  apartmentFriendly: {
    high: "Adapts well to apartment living",
    low: "Does best with more space",
  },
  independence: {
    high: "Comfortable spending time alone",
    low: "Prefers to stay close to its people",
  },
  noviceFriendly: {
    high: "A great match for first-time owners",
    low: "Best suited to experienced owners",
  },
  vocal: {
    high: "Tends to be quite vocal",
    low: "Generally quiet",
  },
  runningPartner: {
    high: "Makes a strong running companion",
    low: "Not built for serious running",
  },
  heatTolerance: {
    high: "Handles warm weather well",
    low: "Struggles in hot weather",
  },
  coldTolerance: {
    high: "Handles cold weather well",
    low: "Struggles in cold weather",
  },
};

/**
 * Up to `max` short, plain-language highlights for a breed's detail page,
 * picked from its most extreme trait scores (furthest from the neutral
 * midpoint of 3) and phrased via `TRAIT_HIGHLIGHT_PHRASES`. Traits scored
 * exactly 3 are unremarkable and never included.
 */
export function getBreedHighlights(breed: Breed, max = 3): string[] {
  return TRAIT_FIELDS.map((field) => breed[field.key])
    .map((value, index) => ({ key: TRAIT_FIELDS[index].key, value }))
    .filter((entry) => entry.value !== 3)
    .sort((a, b) => Math.abs(b.value - 3) - Math.abs(a.value - 3))
    .slice(0, max)
    .map((entry) => TRAIT_HIGHLIGHT_PHRASES[entry.key][entry.value >= 4 ? "high" : "low"]);
}
