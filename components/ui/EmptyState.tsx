import type { ComponentProps, ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  heading: Heading = "h2",
  children,
  ...props
}: Omit<ComponentProps<"div">, "title" | "className"> & {
  title: ReactNode;
  description: ReactNode;
  heading?: "h1" | "h2";
}) {
  return (
    <div
      className="rounded-[14px] border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-600"
      {...props}
    >
      <Heading className="text-xl font-semibold">{title}</Heading>
      <p className="mt-2.5 mb-5.5 leading-[1.6] text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {children}
    </div>
  );
}
