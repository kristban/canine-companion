"use client";

import { useMemo, useState, type ReactNode } from "react";

// A small, generic column-filtered table for the admin lists. Rows are passed
// in from a Server Component (already fetched via the service-role layer) and
// filtered entirely in the browser — the admin lists load the full table, so
// there's no need to round-trip to Supabase on every keystroke. Each column can
// declare a text or select filter that renders under its header; matching rows
// update instantly. Column configs (with their accessor/cell closures) must be
// defined inside a Client Component — see BreedsTable / SubscribersTable.

interface TextFilter<Row> {
  kind: "text";
  /** The string this column's text filter matches against (case-insensitive). */
  accessor: (row: Row) => string;
  placeholder?: string;
}

interface SelectFilter<Row> {
  kind: "select";
  /** The exact value this column's select filter matches against. */
  accessor: (row: Row) => string;
  options: readonly { value: string; label: string }[];
  /** Label for the "no filter" option, e.g. "All sizes". */
  allLabel: string;
}

export type ColumnFilter<Row> = TextFilter<Row> | SelectFilter<Row>;

export interface Column<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
  filter?: ColumnFilter<Row>;
  /** Accessible name for the filter control (the visible header is separate). */
  filterLabel?: string;
}

interface FilterableTableProps<Row> {
  rows: Row[];
  columns: Column<Row>[];
  getRowKey: (row: Row) => string;
  /** Tailwind min-width utility so the table scrolls rather than squashing. */
  minWidthClass?: string;
  /** [singular, plural] noun for the result count, e.g. ["breed", "breeds"]. */
  noun: readonly [string, string];
}

const FILTER_INPUT =
  "transition-smooth w-full rounded-xl border-2 border-border bg-background px-3 py-1.5 text-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function FilterableTable<Row>({
  rows,
  columns,
  getRowKey,
  minWidthClass = "min-w-[36rem]",
  noun,
}: FilterableTableProps<Row>) {
  // columnId -> current filter value ("" means inactive).
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return rows.filter((row) =>
      columns.every((column) => {
        const filter = column.filter;
        const value = filters[column.id];
        if (!filter || !value) return true;
        const cell = filter.accessor(row);
        return filter.kind === "text"
          ? cell.toLowerCase().includes(value.toLowerCase())
          : cell === value;
      }),
    );
  }, [rows, columns, filters]);

  const hasActiveFilter = Object.values(filters).some(Boolean);
  const setFilter = (id: string, value: string) =>
    setFilters((current) => ({ ...current, [id]: value }));

  const count = filtered.length;
  // Noun agrees with the total (the "of N" set), so a filtered count of 1 still
  // reads "1 of 20 breeds", not "1 of 20 breed".
  const totalNoun = rows.length === 1 ? noun[0] : noun[1];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm font-bold text-muted">
          {hasActiveFilter
            ? `${count} of ${rows.length} ${totalNoun}`
            : `${rows.length} ${totalNoun}`}
        </p>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="transition-smooth rounded-full border-2 border-border bg-surface px-3 py-1 text-sm font-bold text-text shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border-3 border-border bg-surface shadow-hard">
        <table
          className={`w-full ${minWidthClass} border-collapse text-left text-sm`}
        >
          <thead>
            <tr className="border-b-2 border-border bg-background-alt">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-5 py-3 font-extrabold uppercase tracking-wide text-text ${
                    column.align === "right" ? "text-right" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
            <tr className="border-b-2 border-border/40 bg-background-alt/60">
              {columns.map((column) => (
                <th key={column.id} className="px-5 pb-3 align-top font-normal">
                  {column.filter ? (
                    <FilterControl
                      filter={column.filter}
                      label={column.filterLabel ?? "Filter column"}
                      value={filters[column.id] ?? ""}
                      onChange={(value) => setFilter(column.id, value)}
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-muted"
                >
                  <p className="font-bold text-text">No matches</p>
                  <p className="mt-1 text-sm">
                    No {noun[1]} match the current filters.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-b-2 border-border/15 last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-5 py-3 ${
                        column.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterControl<Row>({
  filter,
  label,
  value,
  onChange,
}: {
  filter: ColumnFilter<Row>;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  if (filter.kind === "select") {
    return (
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FILTER_INPUT} capitalize`}
      >
        <option value="">{filter.allLabel}</option>
        {filter.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={filter.placeholder ?? "Filter…"}
      autoComplete="off"
      className={FILTER_INPUT}
    />
  );
}
