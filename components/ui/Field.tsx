import type { ReactNode } from "react";

/** The label style shared by every form. */
export const LABEL_CLASS =
  "font-display text-[15px] leading-[1.3] font-medium text-ink";
export const HINT_CLASS = "text-sm leading-[1.45] text-subtle";
export const ERROR_CLASS = "text-sm leading-[1.45] font-medium text-danger";

/** A label above a control, with an optional hint underneath it. */
export default function Field({
  label,
  htmlFor,
  hint,
  hintId,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  hintId?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className={HINT_CLASS}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** A form-level message: an error, or a confirmation. */
export function FormAlert({
  children,
  id,
  tone = "error",
}: {
  children: ReactNode;
  id?: string;
  tone?: "error" | "success";
}) {
  return (
    <p
      id={id}
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[15px] leading-normal ${
        tone === "error"
          ? "border-red-200 bg-danger-soft text-danger"
          : "border-green-200 bg-green-50 text-success"
      }`}
    >
      {children}
    </p>
  );
}

/** A small spinner for buttons that are working. */
export function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
