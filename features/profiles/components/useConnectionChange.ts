"use client";

import { useState, useTransition } from "react";

import type { Outcome } from "../profiles";

/**
 * Runs a Connection change from a button: busy while it runs, with the
 * refusal or a generic failure as `feedback`, and `onDone` after success.
 */
export function useConnectionChange(
  failureMessage = "The request could not be changed. Please try again.",
) {
  const [feedback, setFeedback] = useState("");
  const [busy, startTransition] = useTransition();

  function change(action: () => Promise<Outcome>, onDone?: () => void) {
    setFeedback("");
    startTransition(async () => {
      const result = await action().catch((): Outcome => ({
        ok: false,
        message: failureMessage,
      }));
      if (result.ok) {
        onDone?.();
      } else {
        setFeedback(result.message);
      }
    });
  }

  return { busy, feedback, setFeedback, change };
}
