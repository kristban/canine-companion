"use client";

import Link from "next/link";
import { type Subscriber, SUBSCRIBER_STATUSES } from "@/lib/admin/types";
import { type Column, FilterableTable } from "./FilterableTable";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { dateStyle: "medium" });
}

// Defined at module scope for a stable identity (see BreedsTable). The "Joined"
// filter matches the *formatted* date string, so typing "2026" or "Jul" works.
const COLUMNS: Column<Subscriber>[] = [
  {
    id: "name",
    header: "Name",
    filter: { kind: "text", accessor: (row) => row.name, placeholder: "Search name…" },
    filterLabel: "Filter by name",
    cell: (row) => <span className="font-bold text-text">{row.name}</span>,
  },
  {
    id: "email",
    header: "Email",
    filter: { kind: "text", accessor: (row) => row.email, placeholder: "Search email…" },
    filterLabel: "Filter by email",
    cell: (row) => <span className="text-muted">{row.email}</span>,
  },
  {
    id: "status",
    header: "Status",
    filter: {
      kind: "select",
      accessor: (row) => row.status,
      allLabel: "All statuses",
      options: SUBSCRIBER_STATUSES.map((status) => ({
        value: status,
        label: capitalize(status),
      })),
    },
    filterLabel: "Filter by status",
    cell: (row) => (
      <span
        className={`inline-flex items-center rounded-full border-2 border-border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ${
          row.status === "subscribed"
            ? "bg-accent/40 text-text"
            : "bg-background-alt text-muted"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "joined",
    header: "Joined",
    filter: {
      kind: "text",
      accessor: (row) => formatDate(row.createdAt),
      placeholder: "Search date…",
    },
    filterLabel: "Filter by join date",
    cell: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    align: "right",
    cell: (row) => (
      <div className="flex justify-end gap-3 font-bold">
        <Link
          href={`/admin/newsletter/${row.id}`}
          className="transition-smooth text-primary hover:underline"
        >
          View
        </Link>
        <Link
          href={`/admin/newsletter/${row.id}/edit`}
          className="transition-smooth text-primary hover:underline"
        >
          Edit
        </Link>
      </div>
    ),
  },
];

export function SubscribersTable({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  return (
    <FilterableTable
      rows={subscribers}
      columns={COLUMNS}
      getRowKey={(row) => row.id}
      noun={["subscriber", "subscribers"]}
    />
  );
}
