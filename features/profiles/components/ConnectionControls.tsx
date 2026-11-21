"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { INPUT_CLASS } from "@/components/Input";
import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import { ERROR_CLASS, HINT_CLASS, LABEL_CLASS, Spinner } from "@/components/ui/Field";
import { sendConnectionRequest } from "../actions";
import { cooldownDate, REQUEST_MESSAGE_MAX_LENGTH, requestMessage, type Relationship } from "../connection-model";
import { profileHref } from "../profile-model";
import type { HelpOfferView } from "../profiles";
import { REQUEST_MESSAGE } from "./profile-styles";
import RemoveConnection from "./RemoveConnection";
import RequestActions from "./RequestActions";
import { useConnectionChange } from "./useConnectionChange";

type Props = {
  studentId: string;
  displayName: string;
  relationship: Relationship;
  offers: HelpOfferView[];
  ownProfileHref: string;
  hasContacts: boolean;
  /** On a course card: smaller, and Connected links to the Profile instead of offering Remove. */
  onCard?: boolean;
};

const STATUS = "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[13px] leading-[1.2] font-semibold";

export default function ConnectionControls({ studentId, displayName, relationship, offers, ownProfileHref, hasContacts, onCard = false }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState("");
  const [message, setMessage] = useState("");
  const { busy, feedback, change } = useConnectionChange();
  const length = Array.from(requestMessage(message)).length;
  const tooLong = length > REQUEST_MESSAGE_MAX_LENGTH;
  const selected = offers.some((offer) => offer.courseCode === course) ? course : offers[0]?.courseCode ?? "";
  const size = onCard ? "sm" : "md";

  if (relationship.status === "self") return null;
  return (
    <section
      className={onCard ? "flex flex-col gap-2.5 px-4 pb-3.5 sm:pl-[74px]" : "flex flex-col gap-3 border-t border-line pt-5"}
      aria-label={`Connection with ${displayName}`}
    >
      {relationship.status === "outgoing" && (
        <div className="flex flex-wrap items-center gap-2.5">
          <p role="status" className={`${STATUS} bg-brand-50 text-brand-strong`}>Requested</p>
          <RequestActions studentId={studentId} requestId={relationship.requestId} kind="outgoing" />
        </div>
      )}
      {relationship.status === "incoming" && <>
        <p className="font-display text-[15px] leading-[1.35] font-medium text-ink">Wants to connect about {relationship.courseCode}</p>
        {relationship.message && <p className={REQUEST_MESSAGE}>{relationship.message}</p>}
        <p className={HINT_CLASS}>Accepting lets you both see each other’s contact details.</p>
        <RequestActions studentId={studentId} requestId={relationship.requestId} kind="incoming" size={size} />
      </>}
      {relationship.status === "connected" && (onCard
        ? <Link href={profileHref(studentId)} className={`${STATUS} bg-green-50 text-success`}>Connected · view profile</Link>
        : <>
          <p role="status" className={`${STATUS} bg-green-50 text-success`}>Connected</p>
          <RemoveConnection studentId={studentId} displayName={displayName} label="Remove connection" />
        </>)}
      {relationship.status === "declined" && (
        <p role="status" className={`${STATUS} bg-well text-muted`}>Declined · you can ask again on {cooldownDate(relationship.until)}</p>
      )}
      {relationship.status === "none" && offers.length > 0 && (open ? (
        <form className="flex flex-col gap-3.5" onSubmit={(event) => { event.preventDefault(); change(() => sendConnectionRequest(studentId, selected, message), () => { setOpen(false); setMessage(""); }); }}>
          {offers.length > 1 ? (
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={`${id}-course`} className={LABEL_CLASS}>Course</label>
              <select id={`${id}-course`} className={INPUT_CLASS} value={selected} disabled={busy} onChange={(event) => setCourse(event.target.value)} required>
                {offers.map((offer) => <option key={offer.courseCode} value={offer.courseCode}>{offer.courseCode} — {offer.title}</option>)}
              </select>
            </div>
          ) : <p className={HINT_CLASS}>About {offers[0].courseCode} — {offers[0].title}</p>}
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-message`} className={LABEL_CLASS}>Message <span className="font-normal text-subtle">(optional)</span></label>
            <textarea
              id={`${id}-message`}
              rows={3}
              className={`${INPUT_CLASS} resize-y leading-[1.55]`}
              value={message}
              disabled={busy}
              aria-describedby={`${id}-length`}
              aria-invalid={tooLong || undefined}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p id={`${id}-length`} className={tooLong ? ERROR_CLASS : `${HINT_CLASS} self-end tabular-nums`}>
              {length} / {REQUEST_MESSAGE_MAX_LENGTH}{tooLong ? " characters. Please shorten your message." : ""}
            </p>
          </div>
          {!hasContacts && (
            <p className={HINT_CLASS}>
              You haven’t added contact details. <Link href={ownProfileHref} className={LINK_CLASS}>Add some on your profile</Link> so they can reach you after connecting. You can still send this request.
            </p>
          )}
          <p className={HINT_CLASS}>If accepted, you can both see each other’s contact details.</p>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClass({ size })} disabled={busy || !selected || tooLong}>{busy && <Spinner />}{busy ? "Sending…" : "Send request"}</button>
            <button type="button" className={buttonClass({ variant: "ghost", size })} disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      ) : <button type="button" className={buttonClass({ size, block: !onCard, className: onCard ? "w-fit" : "" })} onClick={() => setOpen(true)}>Connect</button>)}
      {feedback && <p role="alert" className={ERROR_CLASS}>{feedback}</p>}
    </section>
  );
}
