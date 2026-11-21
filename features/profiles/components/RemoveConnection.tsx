"use client";

import { useId, useRef } from "react";

import { buttonClass } from "@/components/ui/button";
import { ERROR_CLASS, Spinner } from "@/components/ui/Field";

import { removeConnectionWith } from "../actions";
import { DIALOG } from "./profile-styles";
import { useConnectionChange } from "./useConnectionChange";

interface Props {
  studentId: string;
  displayName: string;
  label: string;
}

export default function RemoveConnection({
  studentId,
  displayName,
  label,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { busy, feedback, setFeedback, change } = useConnectionChange(
    "The connection could not be removed. Please try again.",
  );

  return (
    <>
      <button
        type="button"
        className={buttonClass({
          variant: "ghost",
          size: "sm",
          className: "w-fit text-danger hover:not-disabled:text-danger",
        })}
        onClick={() => {
          setFeedback("");
          dialog.current?.showModal();
        }}
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className={`${DIALOG} w-[min(calc(100%-32px),440px)]`}
      >
        <h2
          id={titleId}
          className="font-display text-lg leading-[1.3] font-semibold"
        >
          Remove your connection with {displayName}?
        </h2>
        <p className="mt-3 mb-5 leading-[1.6] text-ink-2">
          You’ll no longer see each other’s contact details. {displayName} won’t
          be notified, and either of you can send a new request.
        </p>
        {feedback && (
          <p role="alert" className={`${ERROR_CLASS} mb-4`}>
            {feedback}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={buttonClass({ variant: "secondary" })}
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass({ variant: "danger" })}
            disabled={busy}
            onClick={() => {
              change(
                async () => removeConnectionWith(studentId),
                () => dialog.current?.close(),
              );
            }}
          >
            {busy && <Spinner />}
            {busy ? "Removing…" : "Remove"}
          </button>
        </div>
      </dialog>
    </>
  );
}
