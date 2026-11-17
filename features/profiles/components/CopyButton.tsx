"use client";

import { useEffect, useState } from "react";
import styles from "../profile.module.css";

/** Copies `value` to the clipboard and confirms with "Copied". */
export default function CopyButton({ value, label, children }: { value: string; label: string; children: React.ReactNode }) {
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
      <button type="button" className={styles.contactLink} aria-label={label} onClick={copy}>
        {children}
      </button>
      <span role="status" className={styles.copied}>
        {status === "copied" ? "Copied" : status === "failed" ? "Couldn’t copy" : ""}
      </span>
    </>
  );
}
