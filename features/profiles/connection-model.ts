import { normalizeBio } from "./profile-model";

export const REQUEST_MESSAGE_MAX_LENGTH = 300;
export const MAX_PENDING_OUTGOING = 20;
export const DECLINE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type ConnectionRefusal =
  | { reason: "self" | "not-volunteer" | "pending-exists" | "already-connected" | "limit" | "message-too-long" | "not-found" | "no-profile" }
  | { reason: "cooldown"; until: string };
export type ConnectionOutcome = { ok: true } | ({ ok: false } & ConnectionRefusal);

export type Relationship =
  | { status: "none" | "self" | "connected" }
  | { status: "outgoing"; requestId: string }
  | { status: "incoming"; requestId: string; courseCode: string; message: string }
  | { status: "declined"; until: string };

export type RelatedStudent = { id: string; displayName: string; initials: string; pictureUrl: string | null; href: string };

export type IncomingRequest = { student: RelatedStudent; requestId: string; courseCode: string; message: string };
export type SentRequest = { student: RelatedStudent; courseCode: string } & (
  | { status: "pending"; requestId: string }
  | { status: "declined"; until: string }
);

/** The viewer's own requests, visible only to them. */
export type ConnectionsOverview = { incoming: IncomingRequest[]; sent: SentRequest[] };

export function requestMessage(raw: string) {
  return normalizeBio(raw);
}

export function connectionRefusalMessage(refusal: ConnectionRefusal) {
  switch (refusal.reason) {
    case "self": return "You can’t send a request to yourself.";
    case "not-volunteer": return "This student no longer offers help with that course.";
    case "pending-exists": return "There is already a pending request between you.";
    case "already-connected": return "You are already connected.";
    case "cooldown": return `You can ask again on ${refusal.until.slice(0, 10)} (UTC).`;
    case "limit": return `You already have ${MAX_PENDING_OUTGOING} pending requests. Wait for a response or withdraw one.`;
    case "message-too-long": return `Keep your message to ${REQUEST_MESSAGE_MAX_LENGTH} characters or fewer.`;
    case "not-found": return "This request was withdrawn or already handled. Refresh to see the latest status.";
    case "no-profile": return "This profile is no longer available.";
  }
}
