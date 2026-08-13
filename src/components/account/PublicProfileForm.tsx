"use client";

// Lets a signed-in user edit their PUBLIC identity (username, display name,
// avatar, bio) — the `profiles` table, readable by anyone. Upserts by `id`
// (the user's own id), so it works whether or not a profile row exists yet.
// Also syncs `user_metadata.display_name` so the nav (AuthNav, which reads
// user_metadata rather than this table) picks up the new name immediately.

import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PROFILES_TABLE, USERNAME_PATTERN, type Profile } from "@/lib/profile";

interface PublicProfileFormProps {
  userId: string;
  initialProfile: Profile | null;
  /** The Google profile picture, used to prefill the avatar field on first setup. */
  googleAvatarUrl?: string | null;
}

type Message = { kind: "success" | "error"; text: string } | null;

export function PublicProfileForm({
  userId,
  initialProfile,
  googleAvatarUrl,
}: PublicProfileFormProps) {
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [displayName, setDisplayName] = useState(
    initialProfile?.display_name ?? "",
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialProfile?.avatar_url ?? googleAvatarUrl ?? "",
  );
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const trimmedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(trimmedUsername)) {
      setMessage({
        kind: "error",
        text: "Username must be 3-20 characters: lowercase letters, numbers, and underscores only.",
      });
      return;
    }

    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const trimmedDisplayName = displayName.trim() || null;
    const { error } = await supabase.from(PROFILES_TABLE).upsert({
      id: userId,
      username: trimmedUsername,
      display_name: trimmedDisplayName,
      avatar_url: avatarUrl.trim() || null,
      bio: bio.trim() || null,
    });

    if (error) {
      setSaving(false);
      setMessage({
        kind: "error",
        text:
          error.code === "23505"
            ? "That username is already taken."
            : error.message,
      });
      return;
    }

    // Nav reads user_metadata, not the profiles table — keep them in sync.
    await supabase.auth.updateUser({
      data: { display_name: trimmedDisplayName },
    });

    setUsername(trimmedUsername);
    setSaving(false);
    setMessage({ kind: "success", text: "Saved." });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard sm:p-8"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-text">
          Public profile
        </h2>
        <p className="mt-1 text-sm text-muted">
          Anyone can see your username, display name, avatar, and bio.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-username" className="text-sm font-bold text-text">
          Username
        </label>
        <input
          id="profile-username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. dogperson42"
          required
          className="rounded-2xl border-2 border-border bg-background px-4 py-3 text-base font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <p className="text-xs text-muted">
          3-20 characters: lowercase letters, numbers, and underscores.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="profile-display-name"
          className="text-sm font-bold text-text"
        >
          Display name
        </label>
        <input
          id="profile-display-name"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="rounded-2xl border-2 border-border bg-background px-4 py-3 text-base font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="profile-avatar-url"
          className="text-sm font-bold text-text"
        >
          Avatar URL
        </label>
        <input
          id="profile-avatar-url"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://…"
          className="rounded-2xl border-2 border-border bg-background px-4 py-3 text-base font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <p className="text-xs text-muted">
          Defaults to your Google profile picture — replace it with any image
          URL if you&apos;d rather use something else.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="profile-bio" className="text-sm font-bold text-text">
          Bio
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          maxLength={280}
          className="rounded-2xl border-2 border-border bg-background px-4 py-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold shadow-hard-sm ${
            message.kind === "error"
              ? "border-red-500 bg-red-50 text-red-800"
              : "border-border bg-secondary/30 text-text"
          }`}
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
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
