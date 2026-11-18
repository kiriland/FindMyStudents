"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "aws-amplify/auth";
import { INPUT_CLASS } from "@/components/Input";
import { buttonClass } from "@/components/ui/button";
import { ERROR_CLASS, HINT_CLASS, LABEL_CLASS, Spinner } from "@/components/ui/Field";
import { useAuth } from "@/features/auth/useAuth";
import { deleteAccount } from "../actions";
import { DELETE_ACCOUNT_PHRASE } from "../profile-model";
import type { Outcome } from "../profiles";
import { PANEL, PANEL_BODY, PANEL_HEAD, PANEL_TITLE } from "./profile-styles";

/** Deleting the owner's account, after they type their email and DELETE_ACCOUNT_PHRASE. */
export default function DeleteAccount() {
  const { account } = useAuth();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [email, setEmail] = useState("");
  const [phrase, setPhrase] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, startTransition] = useTransition();
  const accountEmail = account?.email ?? "";
  const confirmed = !!accountEmail
    && email.trim().toLowerCase() === accountEmail.toLowerCase()
    && phrase.trim().toLowerCase() === DELETE_ACCOUNT_PHRASE;

  function remove() {
    setFeedback("");
    startTransition(async () => {
      const result = await deleteAccount(email, phrase).catch((): Outcome => ({ ok: false, message: "Your account could not be deleted. Please try again." }));
      if (!result.ok) return setFeedback(result.message);
      try {
        // Also signs the browser out.
        await deleteUser();
      } catch {
        return setFeedback("Your profile was deleted, but your login could not be. Please try again.");
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="delete-account" className={PANEL}>
      <div className={PANEL_HEAD}>
        <h2 id="delete-account" className={PANEL_TITLE}>Delete account</h2>
      </div>
      <div className={PANEL_BODY}>
        <p className={HINT_CLASS}>
          This deletes your login, profile, picture, Help Offers, Connection Requests and Connections. It can’t be undone.
        </p>
        <button
          type="button"
          className={buttonClass({ variant: "secondary", className: "w-fit text-danger" })}
          onClick={() => { setFeedback(""); dialog.current?.showModal(); }}
        >
          Delete account
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[min(calc(100%-32px),480px)] rounded-card border border-line bg-surface p-6 text-ink shadow-float backdrop:bg-ink/40"
      >
        <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); if (confirmed) remove(); }}>
          <h2 id={`${id}-title`} className="font-display text-lg leading-[1.3] font-semibold">Delete your account?</h2>
          <p className="leading-[1.6] text-ink-2">Everything on your profile and all your Connections are deleted for good. Other students won’t be notified.</p>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-email`} className={LABEL_CLASS}>Type your email{accountEmail && <> (<span className="[overflow-wrap:anywhere]">{accountEmail}</span>)</>}</label>
            <input id={`${id}-email`} type="email" autoComplete="off" className={INPUT_CLASS} value={email} disabled={busy} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-phrase`} className={LABEL_CLASS}>Type “{DELETE_ACCOUNT_PHRASE}”</label>
            <input id={`${id}-phrase`} type="text" autoComplete="off" className={INPUT_CLASS} value={phrase} disabled={busy} onChange={(event) => setPhrase(event.target.value)} />
            <p className={HINT_CLASS}>Delete stays off until both match.</p>
          </div>
          {feedback && <p role="alert" className={ERROR_CLASS}>{feedback}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={buttonClass({ variant: "secondary" })} disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button>
            <button className={buttonClass({ className: "bg-danger hover:not-disabled:bg-danger/90" })} disabled={busy || !confirmed}>
              {busy && <Spinner />}{busy ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
