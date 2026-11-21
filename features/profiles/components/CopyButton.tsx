"use client";

import { useEffect, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";

const STATUS_TEXT: Record<CopyStatus, string> = {
  idle: "",
  copied: "Copied",
  failed: "Couldn’t copy",
};

/** Copies `value` to the clipboard and confirms with "Copied". */
export default function CopyButton({
  value,
  label,
  className,
  children,
}: {
  value: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus("idle");
    }, 2000);
    return () => {
      window.clearTimeout(timeout);
    };
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
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={() => {
          void copy();
        }}
      >
        {children}
      </button>
      <span
        role="status"
        className={`font-display text-[13px] font-semibold ${status === "failed" ? "text-danger" : "text-success"}`}
      >
        {STATUS_TEXT[status]}
      </span>
    </>
  );
}
