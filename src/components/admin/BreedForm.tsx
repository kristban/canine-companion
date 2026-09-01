"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  type AdminBreed,
  BREED_GROUPS,
  EMPTY_FORM_STATE,
  type FormState,
  SIZES,
  type TraitKey,
  TRAIT_FIELDS,
} from "@/lib/admin/types";
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "./formFields";

type BreedValues = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  imageUrl: string;
  size: string;
  group: string;
} & Record<TraitKey, string>;

function toValues(breed: AdminBreed | null): BreedValues {
  const values = {
    id: breed?.id ?? "",
    name: breed?.name ?? "",
    emoji: breed?.emoji ?? "",
    tagline: breed?.tagline ?? "",
    description: breed?.description ?? "",
    imageUrl: breed?.imageUrl ?? "",
    size: breed?.size ?? "medium",
    group: breed?.group ?? BREED_GROUPS[0].value,
  } as BreedValues;
  for (const { key } of TRAIT_FIELDS) {
    values[key] = breed ? String(breed[key]) : "3";
  }
  return values;
}

interface BreedFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  breed: AdminBreed | null;
  mode: "create" | "edit";
}

export function BreedForm({ action, breed, mode }: BreedFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    EMPTY_FORM_STATE,
  );
  const [values, setValues] = useState<BreedValues>(() => toValues(breed));

  const set = (field: keyof BreedValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));
  const err = (field: string) => state.errors?.[field];

  const cancelHref =
    mode === "edit" && breed ? `/admin/breeds/${breed.id}` : "/admin/breeds";

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={isPending}
      className="flex flex-col gap-8"
    >
      <fieldset className="flex flex-col gap-5 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <legend className="px-2 font-display text-lg font-semibold text-text">
          Identity
        </legend>
        <TextField
          id="breed-id"
          name="id"
          label="ID (slug)"
          value={values.id}
          onChange={set("id")}
          error={err("id")}
          readOnly={mode === "edit"}
          hint={
            mode === "edit"
              ? "The ID is the primary key and can't be changed here."
              : "Lowercase slug, e.g. labrador-retriever. Used in URLs."
          }
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="breed-name"
            name="name"
            label="Name"
            value={values.name}
            onChange={set("name")}
            error={err("name")}
          />
          <TextField
            id="breed-emoji"
            name="emoji"
            label="Emoji"
            value={values.emoji}
            onChange={set("emoji")}
            error={err("emoji")}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="breed-size"
            name="size"
            label="Size"
            value={values.size}
            onChange={set("size")}
            error={err("size")}
            options={SIZES.map((size) => ({ value: size, label: size }))}
          />
          <SelectField
            id="breed-group"
            name="group"
            label="Group"
            value={values.group}
            onChange={set("group")}
            error={err("group")}
            hint="What the breed was bred to do. Used to group the catalog, not for matching."
            options={BREED_GROUPS.map((g) => ({
              value: g.value,
              label: g.label,
            }))}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <legend className="px-2 font-display text-lg font-semibold text-text">
          Copy
        </legend>
        <TextField
          id="breed-tagline"
          name="tagline"
          label="Tagline"
          value={values.tagline}
          onChange={set("tagline")}
          error={err("tagline")}
        />
        <TextAreaField
          id="breed-description"
          name="description"
          label="Description"
          value={values.description}
          onChange={set("description")}
          error={err("description")}
          rows={4}
        />
        <TextField
          id="breed-image-url"
          name="imageUrl"
          label="Photo URL"
          value={values.imageUrl}
          onChange={set("imageUrl")}
          error={err("imageUrl")}
          hint="Optional. Leave blank to show the emoji instead on the breed's public page."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <legend className="px-2 font-display text-lg font-semibold text-text">
          Traits <span className="text-sm font-normal text-muted">(1–5)</span>
        </legend>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRAIT_FIELDS.map(({ key, label, icon }) => (
            <NumberField
              key={key}
              id={`breed-${key}`}
              name={key}
              label={label}
              icon={icon}
              value={values[key]}
              onChange={set(key)}
              error={err(key)}
            />
          ))}
        </div>
      </fieldset>

      {state.formError ? (
        <p
          role="alert"
          className="rounded-2xl border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="transition-smooth rounded-full border-2 border-border bg-primary px-8 py-3 text-base font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-hard-sm"
        >
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create breed"
              : "Save changes"}
        </button>
        <Link
          href={cancelHref}
          className="transition-smooth text-sm font-bold text-muted hover:text-link"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
