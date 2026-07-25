"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  EMPTY_FORM_STATE,
  type FormState,
  type Subscriber,
  SUBSCRIBER_STATUSES,
} from "@/lib/admin/types";
import { SelectField, TextField } from "./formFields";

interface SubscriberValues {
  name: string;
  email: string;
  status: string;
}

function toValues(subscriber: Subscriber | null): SubscriberValues {
  return {
    name: subscriber?.name ?? "",
    email: subscriber?.email ?? "",
    status: subscriber?.status ?? "subscribed",
  };
}

interface SubscriberFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  subscriber: Subscriber | null;
  mode: "create" | "edit";
}

export function SubscriberForm({
  action,
  subscriber,
  mode,
}: SubscriberFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    EMPTY_FORM_STATE,
  );
  const [values, setValues] = useState<SubscriberValues>(() =>
    toValues(subscriber),
  );

  const set = (field: keyof SubscriberValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));
  const err = (field: string) => state.errors?.[field];

  const cancelHref =
    mode === "edit" && subscriber
      ? `/admin/newsletter/${subscriber.id}`
      : "/admin/newsletter";

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={isPending}
      className="flex flex-col gap-6"
    >
      <fieldset className="flex flex-col gap-5 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <legend className="px-2 font-display text-lg font-semibold text-text">
          Subscriber
        </legend>
        <TextField
          id="subscriber-name"
          name="name"
          label="Name"
          value={values.name}
          onChange={set("name")}
          error={err("name")}
          autoComplete="off"
        />
        <TextField
          id="subscriber-email"
          name="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={set("email")}
          error={err("email")}
          autoComplete="off"
        />
        <SelectField
          id="subscriber-status"
          name="status"
          label="Status"
          value={values.status}
          onChange={set("status")}
          error={err("status")}
          options={SUBSCRIBER_STATUSES.map((status) => ({
            value: status,
            label: status,
          }))}
        />
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
              ? "Add subscriber"
              : "Save changes"}
        </button>
        <Link
          href={cancelHref}
          className="transition-smooth text-sm font-bold text-muted hover:text-primary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
