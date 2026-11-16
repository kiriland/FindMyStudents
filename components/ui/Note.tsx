import type { ComponentProps } from "react";

export default function Note(props: Omit<ComponentProps<"p">, "className">) {
  return (
    <p
      className="mt-[9px] mb-5 text-[13px] leading-[1.6] text-zinc-500 dark:text-zinc-400"
      {...props}
    />
  );
}
