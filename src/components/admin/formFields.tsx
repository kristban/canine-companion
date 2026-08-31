// Presentational, controlled form-field primitives for the admin forms. They
// carry the design-system styling (bordered inputs, focus ring, red error text
// matching SignupForm) so the forms themselves stay readable. No hooks here —
// state lives in the parent form component.

import type { ReactNode } from "react";

const INPUT_BASE =
  "transition-smooth mt-1.5 w-full rounded-2xl border-2 bg-background px-4 py-3 text-base text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";

function borderClass(error?: string) {
  return error ? "border-red-500" : "border-border";
}

interface ShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function FieldShell({ id, label, error, hint, children }: ShellProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-text">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  type?: "text" | "email" | "date";
  autoComplete?: string;
  readOnly?: boolean;
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  readOnly,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        readOnly={readOnly}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${INPUT_BASE} ${borderClass(error)} ${
          readOnly ? "bg-background-alt text-muted" : ""
        }`}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  rows?: number;
}

export function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${INPUT_BASE} resize-y ${borderClass(error)}`}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  error?: string;
  hint?: ReactNode;
}

export function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  options,
  error,
  hint,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${INPUT_BASE} capitalize ${borderClass(error)}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface NumberFieldProps {
  id: string;
  name: string;
  label: string;
  icon?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: number;
  max?: number;
}

/** Compact 1–5 trait input; label + icon sit above a small number box. */
export function NumberField({
  id,
  name,
  label,
  icon,
  value,
  onChange,
  error,
  min = 1,
  max = 5,
}: NumberFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-bold text-text"
      >
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${INPUT_BASE} ${borderClass(error)}`}
      />
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
