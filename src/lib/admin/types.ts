// Shared admin types + descriptor constants.
//
// This module is intentionally free of any server-only code (no env reads, no
// `fetch`, no imports from `http.ts`). It holds only types and plain data, so
// it is safe to import from Client Components (the admin forms) as well as from
// the server-only data layer. Keep it that way — do not import the Supabase
// data helpers here.

// The breed-group taxonomy and trait field descriptors are a single source of
// truth in the public domain module (pure types + plain data, safe to import
// here). Re-exported so admin components can pull them from this one module
// alongside the other admin types.
import {
  BREED_GROUPS,
  TRAIT_FIELDS,
  TRAIT_KEYS,
  type BreedGroup,
  type TraitKey,
} from "@/lib/breeds";
export { BREED_GROUPS, TRAIT_FIELDS, TRAIT_KEYS, type BreedGroup, type TraitKey };

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
  imageUrl: string | null;
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
 * An article as the admin UI works with it: the camelCase `Article` shape
 * (see `@/lib/articles`) plus the server-managed timestamps. `category` and
 * `tags` are free text — unlike breed groups there's no fixed registry, since
 * the article catalog is small and fully admin-curated.
 */
export interface AdminArticle {
  id: string;
  title: string;
  excerpt: string;
  emoji: string;
  category: string;
  tags: string[];
  readingTime: number;
  body: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

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
