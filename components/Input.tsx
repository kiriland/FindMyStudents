import type { InputHTMLAttributes } from "react";

/** The shared text-field look; textareas and inputs in other forms use it too. */
export const INPUT_CLASS =
  "w-full min-h-[46px] rounded-ctl border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-brand focus:shadow-[0_0_0_4px_rgb(37_99_235/0.14)] focus:outline-none disabled:cursor-not-allowed disabled:bg-well disabled:opacity-70 aria-invalid:border-danger aria-invalid:focus:shadow-[0_0_0_4px_rgb(185_28_28/0.12)]";

export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${INPUT_CLASS} ${className}`} {...props} />;
}
