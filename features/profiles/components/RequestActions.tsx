"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
import { ERROR_CLASS, Spinner } from "@/components/ui/Field";
import { acceptConnectionRequest, declineConnectionRequest, withdrawConnectionRequest } from "../actions";
import type { Outcome } from "../profiles";

type Props = { studentId: string; requestId: string; kind: "incoming" | "outgoing" };

export default function RequestActions({ studentId, requestId, kind }: Props) {
  const [feedback, setFeedback] = useState("");
  const [busy, startTransition] = useTransition();

  function change(action: () => Promise<Outcome>) {
    setFeedback("");
    startTransition(async () => {
      const result = await action().catch((): Outcome => ({ ok: false, message: "The request could not be changed. Please try again." }));
      if (!result.ok) setFeedback(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {kind === "incoming" ? <>
          <button type="button" className={buttonClass({ size: "sm" })} disabled={busy} onClick={() => change(() => acceptConnectionRequest(studentId, requestId))}>{busy && <Spinner />}Accept</button>
          <button type="button" className={buttonClass({ variant: "secondary", size: "sm" })} disabled={busy} onClick={() => change(() => declineConnectionRequest(studentId, requestId))}>Decline</button>
        </> : (
          <button type="button" className={buttonClass({ variant: "secondary", size: "sm" })} disabled={busy} onClick={() => change(() => withdrawConnectionRequest(studentId, requestId))}>
            {busy && <Spinner />}{busy ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
      </div>
      {feedback && <p role="alert" className={ERROR_CLASS}>{feedback}</p>}
    </div>
  );
}
