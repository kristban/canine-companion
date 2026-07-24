import { Breed } from "./breeds";

// Row shape as returned by the Supabase REST API (snake_case columns).
interface BreedRow {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  size: Breed["size"];
  energy: number;
  grooming: number;
  trainability: number;
  good_with_kids: number;
  good_with_other_pets: number;
  apartment_friendly: number;
  independence: number;
  novice_friendly: number;
  vocal: number;
  running_partner: number;
  heat_tolerance: number;
  cold_tolerance: number;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function mapRow(row: BreedRow): Breed {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    tagline: row.tagline,
    description: row.description,
    size: row.size,
    energy: row.energy,
    grooming: row.grooming,
    trainability: row.trainability,
    goodWithKids: row.good_with_kids,
    goodWithOtherPets: row.good_with_other_pets,
    apartmentFriendly: row.apartment_friendly,
    independence: row.independence,
    noviceFriendly: row.novice_friendly,
    vocal: row.vocal,
    runningPartner: row.running_partner,
    heatTolerance: row.heat_tolerance,
    coldTolerance: row.cold_tolerance,
  };
}

/**
 * Loads the breed catalog from the Supabase `breeds` table — the single source
 * of truth. There is no bundled fallback: if Supabase isn't configured or the
 * request fails, this returns an empty array and callers render an empty state.
 *
 * Server-only — it relies on the Next.js data cache (`next.revalidate`) and
 * should be called from Server Components, with the result passed down as
 * props (see `src/app/page.tsx` and `src/app/breeds/page.tsx`). Client
 * components receive breeds via props, never by calling this.
 */
export async function getBreeds(): Promise<Breed[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "Cannot load breeds: NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. See .env.example.",
    );
    return [];
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/breeds?select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      // Cache the catalog and refresh it hourly rather than hitting the DB on
      // every request. Breed edits in Supabase appear within the hour.
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error(
        "Failed to load breeds from Supabase.",
        response.status,
        await response.text(),
      );
      return [];
    }

    const rows = (await response.json()) as BreedRow[];
    return Array.isArray(rows) ? rows.map(mapRow) : [];
  } catch (error) {
    console.error("Error loading breeds from Supabase.", error);
    return [];
  }
}
