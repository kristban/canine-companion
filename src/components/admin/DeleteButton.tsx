"use client";

import { useActionState, useState } from "react";
import { type DeleteState, EMPTY_DELETE_STATE } from "@/lib/admin/types";

interface DeleteButtonProps {
  /** The delete Server Action; it reads the row id from the form. */
  action: (state: DeleteState, formData: FormData) => Promise<DeleteState>;
  /** Primary key of the row to delete, submitted as a hidden field. */
  id: string;
  /** Human label shown in the confirmation, e.g. "Labrador Retriever". */
  itemLabel: string;
}

/**
 * Two-step delete: the first click reveals an inline "Are you sure?" confirm
 * (no destructive action happens on a single click), and the confirm submits
 * the Server Action. On success the action redirects to the list.
 */
export function DeleteButton({ action, id, itemLabel }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(
    action,
    EMPTY_DELETE_STATE,
  );

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="transition-smooth rounded-full border-2 border-border bg-surface px-6 py-3 text-base font-bold text-red-700 shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-red-500 bg-red-50 p-4">
      <p className="text-sm font-bold text-text">
        Delete {itemLabel}? This can&apos;t be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={isPending}
            className="transition-smooth rounded-full border-2 border-border bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isPending ? "Deleting…" : "Yes, delete"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="transition-smooth text-sm font-bold text-muted hover:text-primary disabled:opacity-70"
        >
          Cancel
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
