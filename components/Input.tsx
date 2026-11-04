import type { InputHTMLAttributes } from "react";

export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-300 p-3 dark:border-zinc-700 ${className}`}
      {...props}
    />
  );
}
