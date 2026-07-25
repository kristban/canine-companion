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
 */
export type BreedGroup =
  | "sporting"
  | "hound"
  | "working"
  | "terrier"
  | "herding"
  | "toy"
  | "companion";

/**
 * The groups in the order sections should appear (e.g. on the `/breeds`
 * gallery). `label` is the user-facing name, `emoji` is a decorative sticker
 * for section headers, and `blurb` is a one-line description of the group.
 * `companion` is the catch-all for breeds bred primarily for company rather
 * than a specific working role.
 */
export const BREED_GROUPS = [
  {
    value: "sporting",
    label: "Sporting",
    emoji: "🦆",
    blurb: "Athletic retrievers and gun dogs, happiest with a job to do.",
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
    value: "herding",
    label: "Herding",
    emoji: "🐑",
    blurb: "Brilliant, tireless dogs bred to move livestock.",
  },
  {
    value: "toy",
    label: "Toy",
    emoji: "🧸",
    blurb: "Small-but-mighty companions built for lap life.",
  },
  {
    value: "companion",
    label: "Companion",
    emoji: "🛋️",
    blurb: "Easygoing housemates bred first and foremost for good company.",
  },
] as const satisfies ReadonlyArray<{
  value: BreedGroup;
  label: string;
  emoji: string;
  blurb: string;
}>;

/** User-facing label for a group value (e.g. "sporting" -> "Sporting"). */
export function breedGroupLabel(group: BreedGroup): string {
  return BREED_GROUPS.find((g) => g.value === group)?.label ?? group;
}

export interface Breed {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
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
