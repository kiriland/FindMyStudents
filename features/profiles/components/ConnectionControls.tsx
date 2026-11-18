"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { acceptConnectionRequest, declineConnectionRequest, sendConnectionRequest, withdrawConnectionRequest } from "../actions";
import RemoveConnection from "./RemoveConnection";
import { REQUEST_MESSAGE_MAX_LENGTH, requestMessage, type Relationship } from "../connection-model";
import type { HelpOfferView, Outcome } from "../profiles";
import styles from "../profile.module.css";

type Props = {
  studentId: string;
  displayName: string;
  relationship: Relationship;
  offers: HelpOfferView[];
  ownProfileHref: string;
  hasContacts: boolean;
  /** On a course card: Connected links to this Profile instead of offering Remove. */
  cardProfileHref?: string;
};

export default function ConnectionControls({ studentId, displayName, relationship, offers, ownProfileHref, hasContacts, cardProfileHref }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, startTransition] = useTransition();
  const length = Array.from(requestMessage(message)).length;
  const selected = offers.some((offer) => offer.courseCode === course) ? course : offers[0]?.courseCode ?? "";

  function change(action: () => Promise<Outcome>) {
    setFeedback("");
    startTransition(async () => {
      const result = await action().catch((): Outcome => ({ ok: false, message: "The request could not be changed. Please try again." }));
      if (!result.ok) setFeedback(result.message);
      else { setOpen(false); setMessage(""); }
    });
  }

  if (relationship.status === "self") return null;
  return (
    <section className={cardProfileHref ? styles.cardConnection : styles.section} aria-label={`Connection with ${displayName}`}>
      {relationship.status === "outgoing" && <>
        <p role="status">Requested</p>
        <button className={styles.button} disabled={busy} onClick={() => change(() => withdrawConnectionRequest(studentId, relationship.requestId))}>{busy ? "Withdrawing…" : "Withdraw"}</button>
      </>}
      {relationship.status === "incoming" && <>
        <p>This student wants to connect about {relationship.courseCode}.</p>
        {relationship.message && <p className={styles.bio}>{relationship.message}</p>}
        <p className={styles.hint}>Accepting lets you both see each other’s contact details.</p>
        <div className={styles.actions}>
          <button className={`${styles.button} ${styles.primary}`} disabled={busy} onClick={() => change(() => acceptConnectionRequest(studentId, relationship.requestId))}>Accept</button>
          <button className={styles.button} disabled={busy} onClick={() => change(() => declineConnectionRequest(studentId, relationship.requestId))}>Decline</button>
        </div>
        {busy && <p role="status">Saving your response…</p>}
      </>}
      {relationship.status === "connected" && (cardProfileHref ? <Link href={cardProfileHref} className={styles.connected}>Connected · view profile</Link> : <>
        <p role="status">Connected</p>
        <RemoveConnection studentId={studentId} displayName={displayName} label="Remove connection" />
      </>)}
      {relationship.status === "declined" && <p role="status">Declined · you can ask again on {relationship.until.slice(0, 10)} (UTC).</p>}
      {relationship.status === "none" && offers.length > 0 && (open ? (
        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); change(() => sendConnectionRequest(studentId, selected, message)); }}>
          {offers.length > 1 ? (
            <div className={styles.field}>
              <label htmlFor={`${id}-course`}>Course</label>
              <select id={`${id}-course`} value={selected} disabled={busy} onChange={(event) => setCourse(event.target.value)} required>
                {offers.map((offer) => <option key={offer.courseCode} value={offer.courseCode}>{offer.courseCode} — {offer.title}</option>)}
              </select>
            </div>
          ) : <p className={styles.hint}>About {offers[0].courseCode} — {offers[0].title}</p>}
          <div className={styles.field}>
            <label htmlFor={`${id}-message`}>Message (optional)</label>
            <textarea id={`${id}-message`} rows={3} value={message} disabled={busy} aria-describedby={`${id}-length`} aria-invalid={length > REQUEST_MESSAGE_MAX_LENGTH} onChange={(event) => setMessage(event.target.value)} />
            <p id={`${id}-length`} className={length > REQUEST_MESSAGE_MAX_LENGTH ? styles.fieldError : styles.count}>{length} / {REQUEST_MESSAGE_MAX_LENGTH} characters{length > REQUEST_MESSAGE_MAX_LENGTH ? ". Please shorten your message." : ""}</p>
          </div>
          {!hasContacts && <p className={styles.hint}>You haven’t added contact details. <Link href={ownProfileHref}>Add some on your profile</Link> so they can reach you after connecting. You can still send this request.</p>}
          <p className={styles.hint}>If accepted, you can both see each other’s contact details.</p>
          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.primary}`} disabled={busy || !selected || length > REQUEST_MESSAGE_MAX_LENGTH}>{busy ? "Sending…" : "Send request"}</button>
            <button type="button" className={styles.button} disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      ) : <button className={styles.button} onClick={() => setOpen(true)}>Connect</button>)}
      {feedback && <p role="alert" className={styles.fieldError}>{feedback}</p>}
    </section>
  );
}
