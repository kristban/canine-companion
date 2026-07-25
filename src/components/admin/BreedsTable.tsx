"use client";

import Link from "next/link";
import { type AdminBreed, BREED_GROUPS, SIZES } from "@/lib/admin/types";
import { type Column, FilterableTable } from "./FilterableTable";

const GROUP_LABEL = new Map(BREED_GROUPS.map((g) => [g.value, g.label]));

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// Column config for the breeds list. Defined at module scope (stable identity)
// so FilterableTable's memoized filtering doesn't recompute on every render.
const COLUMNS: Column<AdminBreed>[] = [
  {
    id: "name",
    header: "Breed",
    filter: { kind: "text", accessor: (breed) => breed.name, placeholder: "Search name…" },
    filterLabel: "Filter by breed name",
    cell: (breed) => (
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {breed.emoji}
        </span>
        <span className="font-bold text-text">{breed.name}</span>
      </div>
    ),
  },
  {
    id: "id",
    header: "ID",
    filter: { kind: "text", accessor: (breed) => breed.id, placeholder: "Search ID…" },
    filterLabel: "Filter by breed ID",
    cell: (breed) => (
      <span className="font-mono text-xs text-muted">{breed.id}</span>
    ),
  },
  {
    id: "size",
    header: "Size",
    filter: {
      kind: "select",
      accessor: (breed) => breed.size,
      allLabel: "All sizes",
      options: SIZES.map((size) => ({ value: size, label: capitalize(size) })),
    },
    filterLabel: "Filter by size",
    cell: (breed) => <span className="capitalize text-muted">{breed.size}</span>,
  },
  {
    id: "group",
    header: "Group",
    filter: {
      kind: "select",
      accessor: (breed) => breed.group,
      allLabel: "All groups",
      options: BREED_GROUPS.map((g) => ({ value: g.value, label: g.label })),
    },
    filterLabel: "Filter by group",
    cell: (breed) => (
      <span className="text-muted">
        {GROUP_LABEL.get(breed.group) ?? breed.group}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    align: "right",
    cell: (breed) => (
      <div className="flex justify-end gap-3 font-bold">
        <Link
          href={`/admin/breeds/${breed.id}`}
          className="transition-smooth text-primary hover:underline"
        >
          View
        </Link>
        <Link
          href={`/admin/breeds/${breed.id}/edit`}
          className="transition-smooth text-primary hover:underline"
        >
          Edit
        </Link>
      </div>
    ),
  },
];

export function BreedsTable({ breeds }: { breeds: AdminBreed[] }) {
  return (
    <FilterableTable
      rows={breeds}
      columns={COLUMNS}
      getRowKey={(breed) => breed.id}
      noun={["breed", "breeds"]}
    />
  );
}
