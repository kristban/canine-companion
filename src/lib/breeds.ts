// The `Breed` domain type. The breed catalog itself lives in the Supabase
// `breeds` table and is loaded via `getBreeds()` (src/lib/getBreeds.ts) — there
// is no bundled breed data. See docs/data-model.md and supabase/schema.sql.

export type Size = "small" | "medium" | "large";

export interface Breed {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  size: Size;
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
