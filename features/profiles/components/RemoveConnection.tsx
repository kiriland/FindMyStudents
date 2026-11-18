"use client";

import { useId, useRef, useState, useTransition } from "react";
import { removeConnectionWith } from "../actions";
import type { Outcome } from "../profiles";
import styles from "../profile.module.css";

type Props = { studentId: string; displayName: string; label: string };

export default function RemoveConnection({ studentId, displayName, label }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [feedback, setFeedback] = useState("");
  const [busy, startTransition] = useTransition();

  function remove() {
    setFeedback("");
    startTransition(async () => {
      const result = await removeConnectionWith(studentId).catch((): Outcome => ({ ok: false, message: "The connection could not be removed. Please try again." }));
      if (result.ok) dialog.current?.close();
      else setFeedback(result.message);
    });
  }

  return (
    <>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => { setFeedback(""); dialog.current?.showModal(); }}>{label}</button>
      </div>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId}>
        <h2 id={titleId}>Remove your connection with {displayName}?</h2>
        <p>You will no longer see each other’s contact details. {displayName} won’t be notified, and either of you can send a new request.</p>
        {feedback && <p role="alert" className={styles.fieldError}>{feedback}</p>}
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={remove}>{busy ? "Removing…" : "Remove"}</button>
          <button type="button" className={styles.button} disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button>
        </div>
      </dialog>
    </>
  );
}
