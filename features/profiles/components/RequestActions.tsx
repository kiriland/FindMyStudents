"use client";

import { buttonClass } from "@/components/ui/button";
import { ERROR_CLASS, Spinner } from "@/components/ui/Field";
import { acceptConnectionRequest, declineConnectionRequest, withdrawConnectionRequest } from "../actions";
import { useConnectionChange } from "./useConnectionChange";

type Props = { studentId: string; requestId: string; kind: "incoming" | "outgoing"; size?: "sm" | "md" };

/** Accept and Decline for a request to the viewer, or Withdraw for one they sent. */
export default function RequestActions({ studentId, requestId, kind, size = "sm" }: Props) {
  const { busy, feedback, change } = useConnectionChange();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {kind === "incoming" ? <>
          <button type="button" className={buttonClass({ size })} disabled={busy} onClick={() => change(() => acceptConnectionRequest(studentId, requestId))}>{busy && <Spinner />}Accept</button>
          <button type="button" className={buttonClass({ variant: "secondary", size })} disabled={busy} onClick={() => change(() => declineConnectionRequest(studentId, requestId))}>Decline</button>
        </> : (
          <button type="button" className={buttonClass({ variant: "secondary", size })} disabled={busy} onClick={() => change(() => withdrawConnectionRequest(studentId, requestId))}>
            {busy && <Spinner />}{busy ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
      </div>
      {feedback && <p role="alert" className={ERROR_CLASS}>{feedback}</p>}
    </div>
  );
}
