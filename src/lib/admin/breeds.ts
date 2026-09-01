// Server-only breed data access + form validation for the admin interface.
// Imports the service-role HTTP layer, so this must never be pulled into a
// Client Component (see http.ts).

import type { AdminResult } from "./result";
import {
  countRows,
  deleteRows,
  eq,
  insertRow,
  selectOne,
  selectRows,
  updateRows,
} from "./http";
import {
  type AdminBreed,
  type BreedGroup,
  BREED_GROUPS,
  type Size,
  SIZES,
  type TraitKey,
  TRAIT_FIELDS,
} from "./types";

const TABLE = "breeds";

// Row shape as stored in Postgres (snake_case columns).
interface BreedRow {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  image_url: string | null;
  size: Size;
  breed_group: BreedGroup;
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
  created_at?: string;
  updated_at?: string;
}

// camelCase trait key -> snake_case column. The five identically-named traits
// (energy, grooming, trainability, independence, vocal) are added below.
const TRAIT_COLUMN: Record<TraitKey, string> = {
  energy: "energy",
  grooming: "grooming",
  trainability: "trainability",
  goodWithKids: "good_with_kids",
  goodWithOtherPets: "good_with_other_pets",
  apartmentFriendly: "apartment_friendly",
  independence: "independence",
  noviceFriendly: "novice_friendly",
  vocal: "vocal",
  runningPartner: "running_partner",
  heatTolerance: "heat_tolerance",
  coldTolerance: "cold_tolerance",
};

function mapRow(row: BreedRow): AdminBreed {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    tagline: row.tagline,
    description: row.description,
    imageUrl: row.image_url,
    size: row.size,
    group: row.breed_group,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listBreeds(): Promise<AdminResult<AdminBreed[]>> {
  const result = await selectRows<BreedRow>(TABLE, "select=*&order=name.asc");
  if (!result.ok) return result;
  return { ok: true, data: result.data.map(mapRow) };
}

export async function getBreed(
  id: string,
): Promise<AdminResult<AdminBreed | null>> {
  const result = await selectOne<BreedRow>(
    TABLE,
    `${eq("id", id)}&select=*`,
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data ? mapRow(result.data) : null };
}

export function countBreeds(): Promise<AdminResult<number>> {
  return countRows(TABLE);
}

// ---------------------------------------------------------------------------
// Validation — mirrors the DB constraints so users get friendly field errors
// instead of raw 400s. Returns the validated column payload (snake_case) ready
// for insert/update, or a map of field errors keyed by the form field name.
// ---------------------------------------------------------------------------

export interface BreedInput {
  columns: Record<string, unknown>;
  id: string;
}

type ValidationResult =
  | { ok: true; value: BreedInput }
  | { ok: false; errors: Record<string, string> };

function requiredText(
  errors: Record<string, string>,
  field: string,
  raw: FormDataEntryValue | null,
  label: string,
): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) errors[field] = `${label} is required.`;
  return value;
}

export function validateBreed(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {};

  const id = requiredText(errors, "id", formData.get("id"), "ID");
  const name = requiredText(errors, "name", formData.get("name"), "Name");
  const emoji = requiredText(errors, "emoji", formData.get("emoji"), "Emoji");
  const tagline = requiredText(
    errors,
    "tagline",
    formData.get("tagline"),
    "Tagline",
  );
  const description = requiredText(
    errors,
    "description",
    formData.get("description"),
    "Description",
  );

  const imageUrlRaw = formData.get("imageUrl");
  const imageUrl =
    typeof imageUrlRaw === "string" && imageUrlRaw.trim() ? imageUrlRaw.trim() : null;

  const sizeRaw = formData.get("size");
  const size = typeof sizeRaw === "string" ? sizeRaw : "";
  if (!SIZES.includes(size as Size)) {
    errors.size = "Choose a size.";
  }

  const groupRaw = formData.get("group");
  const group = typeof groupRaw === "string" ? groupRaw : "";
  if (!BREED_GROUPS.some((g) => g.value === (group as BreedGroup))) {
    errors.group = "Choose a group.";
  }

  const columns: Record<string, unknown> = {
    id,
    name,
    emoji,
    tagline,
    description,
    image_url: imageUrl,
    size,
    breed_group: group,
  };

  for (const { key, label } of TRAIT_FIELDS) {
    const raw = formData.get(key);
    const str = typeof raw === "string" ? raw.trim() : "";
    if (!str) {
      errors[key] = `${label} is required.`;
      continue;
    }
    const num = Number(str);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      errors[key] = "Must be a whole number from 1 to 5.";
      continue;
    }
    columns[TRAIT_COLUMN[key]] = num;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { columns, id } };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function createBreedRow(
  input: BreedInput,
): Promise<AdminResult<AdminBreed>> {
  return insertRow<BreedRow>(TABLE, input.columns).then((result) =>
    result.ok ? { ok: true, data: mapRow(result.data) } : result,
  );
}

export function updateBreedRow(
  id: string,
  columns: Record<string, unknown>,
): Promise<AdminResult<AdminBreed>> {
  // `id` is the primary key and immutable here — never send it in the update.
  const { id: _ignored, ...rest } = columns;
  void _ignored;
  return updateRows<BreedRow>(TABLE, eq("id", id), rest).then((result) =>
    result.ok ? { ok: true, data: mapRow(result.data) } : result,
  );
}

export function deleteBreedRow(
  id: string,
): Promise<AdminResult<{ deleted: number }>> {
  return deleteRows(TABLE, eq("id", id));
}
