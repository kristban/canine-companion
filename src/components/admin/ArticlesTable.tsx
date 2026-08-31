"use client";

import { useMemo } from "react";
import Link from "next/link";
import { type AdminArticle } from "@/lib/admin/types";
import { type Column, FilterableTable } from "./FilterableTable";

export function ArticlesTable({ articles }: { articles: AdminArticle[] }) {
  // Categories are free text (see docs/data-model.md), so the filter's
  // options come from whatever categories are actually in use right now,
  // not a fixed registry like BREED_GROUPS.
  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(articles.map((a) => a.category))).sort();
    return unique.map((category) => ({ value: category, label: category }));
  }, [articles]);

  const columns: Column<AdminArticle>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Article",
        filter: {
          kind: "text",
          accessor: (article) => article.title,
          placeholder: "Search title…",
        },
        filterLabel: "Filter by title",
        cell: (article) => (
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {article.emoji}
            </span>
            <span className="font-bold text-text">{article.title}</span>
          </div>
        ),
      },
      {
        id: "id",
        header: "ID",
        filter: {
          kind: "text",
          accessor: (article) => article.id,
          placeholder: "Search ID…",
        },
        filterLabel: "Filter by article ID",
        cell: (article) => (
          <span className="font-mono text-xs text-muted">{article.id}</span>
        ),
      },
      {
        id: "category",
        header: "Category",
        filter: {
          kind: "select",
          accessor: (article) => article.category,
          allLabel: "All categories",
          options: categoryOptions,
        },
        filterLabel: "Filter by category",
        cell: (article) => (
          <span className="text-muted">{article.category}</span>
        ),
      },
      {
        id: "readingTime",
        header: "Reading time",
        cell: (article) => (
          <span className="text-muted">{article.readingTime} min</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: (article) => (
          <div className="flex justify-end gap-3 font-bold">
            <Link
              href={`/admin/articles/${article.id}`}
              className="transition-smooth text-link hover:underline"
            >
              View
            </Link>
            <Link
              href={`/admin/articles/${article.id}/edit`}
              className="transition-smooth text-link hover:underline"
            >
              Edit
            </Link>
          </div>
        ),
      },
    ],
    [categoryOptions],
  );

  return (
    <FilterableTable
      rows={articles}
      columns={columns}
      getRowKey={(article) => article.id}
      noun={["article", "articles"]}
    />
  );
}
