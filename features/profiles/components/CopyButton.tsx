"use client";

import { useEffect, useState } from "react";

/** Copies `value` to the clipboard and confirms with "Copied". */
export default function CopyButton({ value, label, className, children }: { value: string; label: string; className: string; children: React.ReactNode }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timeout = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <>
      <button type="button" className={className} aria-label={label} onClick={copy}>
        {children}
      </button>
      <span role="status" className={`font-display text-[13px] font-semibold ${status === "failed" ? "text-danger" : "text-success"}`}>
        {status === "copied" ? "Copied" : status === "failed" ? "Couldn’t copy" : ""}
      </span>
    </>
  );
}
