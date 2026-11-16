import type { ComponentProps } from "react";

type FieldVariant = "auth" | "search";
const inputs = {
  auth: "w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base",
  search:
    "min-h-[46px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950",
};
const labels = {
  auth: "text-base font-semibold",
  search: "mb-2 block text-[13px] font-semibold",
};

export function FieldLabel({
  variant = "search",
  ...props
}: Omit<ComponentProps<"label">, "className"> & { variant?: FieldVariant }) {
  return <label className={labels[variant]} {...props} />;
}

export function Input({
  variant = "search",
  ...props
}: Omit<ComponentProps<"input">, "className"> & { variant?: FieldVariant }) {
  return <input className={inputs[variant]} {...props} />;
}

export function Select(props: Omit<ComponentProps<"select">, "className">) {
  return <select className={inputs.search} {...props} />;
}
