"use client";

import { useState, useTransition } from "react";
import { acceptConnectionRequest, declineConnectionRequest, withdrawConnectionRequest } from "../actions";
import type { Outcome } from "../profiles";
import styles from "../profile.module.css";

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
    <>
      <div className={styles.actions}>
        {kind === "incoming" ? <>
          <button className={`${styles.button} ${styles.primary}`} disabled={busy} onClick={() => change(() => acceptConnectionRequest(studentId, requestId))}>Accept</button>
          <button className={styles.button} disabled={busy} onClick={() => change(() => declineConnectionRequest(studentId, requestId))}>Decline</button>
        </> : (
          <button className={styles.button} disabled={busy} onClick={() => change(() => withdrawConnectionRequest(studentId, requestId))}>{busy ? "Withdrawing…" : "Withdraw"}</button>
        )}
      </div>
      {busy && kind === "incoming" && <p role="status" className={styles.hint}>Saving your response…</p>}
      {feedback && <p role="alert" className={styles.fieldError}>{feedback}</p>}
    </>
  );
}
