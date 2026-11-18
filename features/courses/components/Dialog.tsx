"use client";

import { useEffect, useRef } from "react";
import styles from "../course.module.css";

let openDialogs = 0;
let previousOverflow = "";

export default function Dialog({ title, labelledBy, onDismiss, children }: {
  /** Shown in the dialog bar; also the accessible name unless `labelledBy` resolves. */
  title: string; labelledBy?: string; onDismiss: () => void; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    if (!dialog) return;
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialog.showModal();
    return () => {
      dialog.close();
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={ref} className={styles.dialog} aria-label={title} aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onDismiss();
      }}>
      <div className={styles.dialogBar}><p>{title}</p><button type="button" className={styles.closeButton} onClick={onDismiss} autoFocus>Close</button></div>
      <div className={styles.dialogContent}>{children}</div>
    </dialog>
  );
}
