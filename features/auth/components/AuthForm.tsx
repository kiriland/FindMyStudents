import type { ComponentProps } from "react";

export default function AuthForm({
  title,
  children,
  ...props
}: Omit<ComponentProps<"form">, "className"> & { title: string }) {
  return (
    <form
      className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl bg-white p-7.5"
      {...props}
    >
      <h1 className="text-center text-[30px] font-bold">{title}</h1>
      {children}
    </form>
  );
}
