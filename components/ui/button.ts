export type ButtonVariant = "primary" | "secondary" | "ghost" | "white" | "outline-white";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-ctl border font-display leading-none font-medium tracking-[-0.005em] whitespace-nowrap no-underline transition-[background-color,color,border-color,transform] duration-150 ease-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-brand text-white hover:not-disabled:bg-brand-strong",
  secondary: "border-line-strong bg-surface text-ink hover:not-disabled:bg-well",
  ghost: "border-transparent text-ink-2 hover:not-disabled:bg-well hover:not-disabled:text-ink",
  white: "border-transparent bg-white text-brand-strong hover:bg-brand-50 focus-visible:outline-white",
  "outline-white": "border-white/50 text-white hover:border-white hover:bg-white/10 focus-visible:outline-white",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-[18px] text-[15px]",
  lg: "min-h-13 px-6 text-base",
};

/** Class names for a button or a link styled as one. */
export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return [BASE, VARIANTS[variant], SIZES[size], block ? "w-full" : "", className].filter(Boolean).join(" ");
}

/** An inline text action: a link or button that reads as part of a sentence. */
export const LINK_CLASS =
  "cursor-pointer font-semibold text-brand-strong underline decoration-brand-200 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-current";
