"use server";

// Server Actions for the admin CRUD forms. A "use server" module may only
// export async functions, so shared types/constants live in ./types.
//
// Writes run through the service-role data layer (breeds.ts / subscribers.ts).
// On success each action revalidates the affected pages and redirects; on a
// validation or database failure it returns state for the form to display.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { DeleteState, FormState } from "./types";
import {
  createBreedRow,
  deleteBreedRow,
  updateBreedRow,
  validateBreed,
} from "./breeds";
import {
  createSubscriberRow,
  deleteSubscriberRow,
  updateSubscriberRow,
  validateSubscriber,
} from "./subscribers";

// Breed edits should show up on the public site promptly, not only after the
// hourly getBreeds() revalidation window.
function revalidateBreedPaths(id?: string) {
  revalidatePath("/admin/breeds");
  if (id) revalidatePath(`/admin/breeds/${id}`);
  revalidatePath("/");
  revalidatePath("/breeds");
}

function revalidateSubscriberPaths(id?: string) {
  revalidatePath("/admin/newsletter");
  if (id) revalidatePath(`/admin/newsletter/${id}`);
}

// ---------------------------------------------------------------------------
// Breeds
// ---------------------------------------------------------------------------

export async function createBreed(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const validation = validateBreed(formData);
  if (!validation.ok) return { errors: validation.errors };

  const result = await createBreedRow(validation.value);
  if (!result.ok) {
    if (result.conflict) {
      return { errors: { id: "A breed with this ID already exists." } };
    }
    return { formError: result.error };
  }

  revalidateBreedPaths(result.data.id);
  redirect(`/admin/breeds/${result.data.id}`);
}

export async function updateBreed(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const validation = validateBreed(formData);
  if (!validation.ok) return { errors: validation.errors };

  const result = await updateBreedRow(id, validation.value.columns);
  if (!result.ok) return { formError: result.error };

  revalidateBreedPaths(id);
  redirect(`/admin/breeds/${id}`);
}

export async function deleteBreed(
  _prevState: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing breed id." };

  const result = await deleteBreedRow(id);
  if (!result.ok) return { error: result.error };
  if (result.data.deleted === 0) return { error: "Breed not found." };

  revalidateBreedPaths(id);
  redirect("/admin/breeds");
}

// ---------------------------------------------------------------------------
// Newsletter subscribers
// ---------------------------------------------------------------------------

export async function createSubscriber(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const validation = validateSubscriber(formData);
  if (!validation.ok) return { errors: validation.errors };

  const result = await createSubscriberRow(validation.value);
  if (!result.ok) {
    if (result.conflict) {
      return { errors: { email: "That email is already subscribed." } };
    }
    return { formError: result.error };
  }

  revalidateSubscriberPaths(result.data.id);
  redirect(`/admin/newsletter/${result.data.id}`);
}

export async function updateSubscriber(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const validation = validateSubscriber(formData);
  if (!validation.ok) return { errors: validation.errors };

  const result = await updateSubscriberRow(id, validation.value);
  if (!result.ok) {
    if (result.conflict) {
      return { errors: { email: "That email is already subscribed." } };
    }
    return { formError: result.error };
  }

  revalidateSubscriberPaths(id);
  redirect(`/admin/newsletter/${id}`);
}

export async function deleteSubscriber(
  _prevState: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing subscriber id." };

  const result = await deleteSubscriberRow(id);
  if (!result.ok) return { error: result.error };
  if (result.data.deleted === 0) return { error: "Subscriber not found." };

  revalidateSubscriberPaths(id);
  redirect("/admin/newsletter");
}
