import type { ComponentProps } from "react";
import { focusScope } from "./styles";

export default function PageContainer({
  className = "",
  ...props
}: ComponentProps<"main">) {
  return (
    <main
      className={`mx-auto w-full max-w-[960px] px-6 pt-14 pb-18 max-[640px]:px-4.5 max-[640px]:pt-8 max-[640px]:pb-12 ${focusScope} ${className}`}
      {...props}
    />
  );
}
