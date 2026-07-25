import type { ReactNode } from "react";

type Variant = "info" | "warning" | "error";

const VARIANT_CLASS: Record<Variant, string> = {
  info: "border-border bg-accent/20 text-text",
  warning: "border-border bg-secondary/30 text-text",
  error: "border-red-500 bg-red-50 text-red-800",
};

interface AdminNoticeProps {
  variant?: Variant;
  title?: ReactNode;
  icon?: string;
  children?: ReactNode;
}

/** A bordered banner for config/security notices and error states. */
export function AdminNotice({
  variant = "info",
  title,
  icon,
  children,
}: AdminNoticeProps) {
  return (
    <div
      className={`rounded-2xl border-2 px-5 py-4 shadow-hard-sm ${VARIANT_CLASS[variant]}`}
    >
      {title ? (
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          {icon ? <span aria-hidden="true">{icon}</span> : null}
          {title}
        </p>
      ) : null}
      {children ? (
        <div className={`text-sm leading-relaxed ${title ? "mt-1.5" : ""}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
