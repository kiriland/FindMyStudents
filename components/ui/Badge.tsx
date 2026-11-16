import type { ComponentProps } from "react";

const tones = {
  course:
    "inline-block w-fit rounded-md bg-indigo-50 px-2 py-1.5 text-xs font-bold tracking-[.025em] whitespace-nowrap text-indigo-700 dark:bg-[#252348] dark:text-indigo-200",
  demo: "inline-block rounded-md bg-orange-50 px-2 py-1.25 text-[11px] font-[650] whitespace-nowrap text-orange-800 dark:bg-[#422006] dark:text-orange-200",
};

export default function Badge({
  tone = "course",
  ...props
}: Omit<ComponentProps<"span">, "className"> & { tone?: keyof typeof tones }) {
  return <span className={tones[tone]} {...props} />;
}
