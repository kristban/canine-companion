"use client";

// Lets a signed-in user edit their SIGN-IN email.
// updateUser({ email }) triggers Supabase's confirm-by-link flow; the change
// only takes effect once confirmed (built-in email sender, so delivery can be
// slow / rate-limited — a documented limitation, see docs/data-model.md).
// Display name now lives on the public profile (PublicProfileForm) instead.

import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountFormProps {
  initialEmail: string;
}

type Message = { kind: "success" | "error" | "info"; text: string } | null;

export function AccountForm({ initialEmail }: AccountFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const trimmed = email.trim();
    if (trimmed.toLowerCase() === initialEmail.trim().toLowerCase()) {
      setMessage({ kind: "info", text: "Nothing to update." });
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setMessage({ kind: "error", text: "Please enter a valid email address." });
      return;
    }

    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSaving(false);

    if (error) {
      setMessage({ kind: "error", text: error.message });
      return;
    }
    setMessage({
      kind: "info",
      text: `Check ${trimmed} for a confirmation link — your email updates once you confirm it.`,
    });
    // Revert the field; it isn't the account email until confirmed.
    setEmail(initialEmail);
  }

  const messageClass =
    message?.kind === "error"
      ? "border-red-500 bg-red-50 text-red-800"
      : message?.kind === "success"
        ? "border-border bg-secondary/30 text-text"
        : "border-border bg-accent/20 text-text";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-text">
          Sign-in email
        </h2>
        <p className="mt-1 text-sm text-muted">
          Private — used only to sign you in, never shown publicly.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="account-email" className="text-sm font-bold text-text">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border-2 border-border bg-background px-4 py-3 text-base font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <p className="text-xs text-muted">
          Changing your email sends a confirmation link to the new address.
        </p>
      </div>

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold shadow-hard-sm ${messageClass}`}
        >
          {message.text}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="transition-smooth rounded-full border-2 border-border bg-primary px-8 py-3 text-base font-bold text-white shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
