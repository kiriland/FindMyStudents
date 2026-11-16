import type { ReactNode } from "react";

export default function ActionGroup({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap gap-5 text-[13px]">{children}</div>
  );
}
