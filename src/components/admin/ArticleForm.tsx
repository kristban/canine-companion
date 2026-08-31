"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  type AdminArticle,
  EMPTY_FORM_STATE,
  type FormState,
} from "@/lib/admin/types";
import { NumberField, TextAreaField, TextField } from "./formFields";

type ArticleValues = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  excerpt: string;
  tags: string;
  readingTime: string;
  publishedAt: string;
  body: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toValues(article: AdminArticle | null): ArticleValues {
  return {
    id: article?.id ?? "",
    title: article?.title ?? "",
    emoji: article?.emoji ?? "",
    category: article?.category ?? "",
    excerpt: article?.excerpt ?? "",
    tags: article?.tags.join(", ") ?? "",
    readingTime: article ? String(article.readingTime) : "5",
    publishedAt: article?.publishedAt ?? todayIso(),
    body: article?.body ?? "",
  };
}

interface ArticleFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  article: AdminArticle | null;
  mode: "create" | "edit";
}

export function ArticleForm({ action, article, mode }: ArticleFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    EMPTY_FORM_STATE,
  );
  const [values, setValues] = useState<ArticleValues>(() =>
    toValues(article),
  );

  const set = (field: keyof ArticleValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));
  const err = (field: string) => state.errors?.[field];

  const cancelHref =
    mode === "edit" && article
      ? `/admin/articles/${article.id}`
      : "/admin/articles";

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
          id="article-id"
          name="id"
          label="ID (slug)"
          value={values.id}
          onChange={set("id")}
          error={err("id")}
          readOnly={mode === "edit"}
          hint={
            mode === "edit"
              ? "The ID is the primary key and can't be changed here."
              : "Lowercase slug, e.g. dog-ownership-law-ireland. Used in the /guides/ URL."
          }
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="article-title"
            name="title"
            label="Title"
            value={values.title}
            onChange={set("title")}
            error={err("title")}
          />
          <TextField
            id="article-emoji"
            name="emoji"
            label="Emoji"
            value={values.emoji}
            onChange={set("emoji")}
            error={err("emoji")}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="article-category"
            name="category"
            label="Category"
            value={values.category}
            onChange={set("category")}
            error={err("category")}
            hint="Free text, e.g. Law & Responsibility. Groups the /guides listing page."
          />
          <TextField
            id="article-tags"
            name="tags"
            label="Tags"
            value={values.tags}
            onChange={set("tags")}
            error={err("tags")}
            hint="Comma-separated, e.g. dog licence, microchip, Irish law."
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <legend className="px-2 font-display text-lg font-semibold text-text">
          Copy
        </legend>
        <TextAreaField
          id="article-excerpt"
          name="excerpt"
          label="Excerpt"
          value={values.excerpt}
          onChange={set("excerpt")}
          error={err("excerpt")}
          hint="Shown on the article card and used as the meta description."
          rows={3}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="article-reading-time"
            name="readingTime"
            label="Reading time (minutes)"
            value={values.readingTime}
            onChange={set("readingTime")}
            error={err("readingTime")}
            min={1}
            max={60}
          />
          <TextField
            id="article-published-at"
            name="publishedAt"
            label="Published date"
            type="date"
            value={values.publishedAt}
            onChange={set("publishedAt")}
            error={err("publishedAt")}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-3xl border-3 border-border bg-surface p-6 shadow-hard-sm sm:p-8">
        <legend className="px-2 font-display text-lg font-semibold text-text">
          Content
        </legend>
        <TextAreaField
          id="article-body"
          name="body"
          label="Body"
          value={values.body}
          onChange={set("body")}
          error={err("body")}
          hint="Markdown. Headings start at ##; the page renders the title as the H1. Tables, links, and lists are supported."
          rows={20}
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
              ? "Create article"
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
