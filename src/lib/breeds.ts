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
