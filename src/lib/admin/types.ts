// Shared admin types + descriptor constants.
//
// This module is intentionally free of any server-only code (no env reads, no
// `fetch`, no imports from `http.ts`). It holds only types and plain data, so
// it is safe to import from Client Components (the admin forms) as well as from
// the server-only data layer. Keep it that way — do not import the Supabase
// data helpers here.

// The breed-group taxonomy is a single source of truth in the public domain
// module (pure types + plain data, safe to import here). Re-exported so admin
// components can pull it from this one module alongside the other admin types.
import { BREED_GROUPS, type BreedGroup } from "@/lib/breeds";
export { BREED_GROUPS, type BreedGroup };

export type Size = "small" | "medium" | "large";

export const SIZES: readonly Size[] = ["small", "medium", "large"];

export type SubscriberStatus = "subscribed" | "unsubscribed";

export const SUBSCRIBER_STATUSES: readonly SubscriberStatus[] = [
  "subscribed",
  "unsubscribed",
];

/**
 * A breed as the admin UI works with it: the camelCase `Breed` shape plus the
 * server-managed timestamps. Traits are 1–5 integers.
 */
export interface AdminBreed {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  size: Size;
  group: BreedGroup;
  energy: number;
  grooming: number;
  trainability: number;
  goodWithKids: number;
  goodWithOtherPets: number;
  apartmentFriendly: number;
  independence: number;
  noviceFriendly: number;
  vocal: number;
  runningPartner: number;
  heatTolerance: number;
  coldTolerance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  status: SubscriberStatus;
  createdAt: string;
}

/**
 * The 12 scored traits, in display order, with a label + icon. Drives the breed
 * form's numeric inputs and the read-only trait bars on the detail page.
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
  key: keyof AdminBreed;
  label: string;
  icon: string;
}>;

export type TraitKey = (typeof TRAIT_FIELDS)[number]["key"];

export const TRAIT_KEYS: readonly TraitKey[] = TRAIT_FIELDS.map((f) => f.key);

/**
 * State returned by the create/update Server Actions and consumed by the forms
 * via `useActionState`. `errors` is keyed by form field name; `formError` is a
 * top-level message (e.g. a duplicate-key conflict or a database error).
 */
export interface FormState {
  errors?: Record<string, string>;
  formError?: string;
}

export const EMPTY_FORM_STATE: FormState = {};

/** State for the delete confirmation flow (also via `useActionState`). */
export interface DeleteState {
  error?: string;
}

export const EMPTY_DELETE_STATE: DeleteState = {};
