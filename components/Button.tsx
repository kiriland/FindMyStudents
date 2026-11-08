import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "rounded-lg bg-zinc-900 px-4 py-3 font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  outline: "rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2",
  ghost: "px-3 py-2",
};

type ButtonVariant = keyof typeof variants;

// Exported so links can share the button styles.
export function buttonClass(variant: ButtonVariant = "primary") {
  return `inline-block shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current ${variants[variant]}`;
}

export default function Button({
  type = "button",
  variant,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={`${buttonClass(variant)} ${className}`} {...props} />;
}
