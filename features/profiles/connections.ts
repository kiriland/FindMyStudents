import "server-only";
import { cache } from "react";
import { randomUUID } from "node:crypto";
import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { paginateQuery, TransactWriteCommand, type TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { db } from "@/lib/dynamodb";
import { isUuid } from "@/lib/uuid";
import { courseCodeKey } from "@/features/courses/course-model";
import { backOff, batchGet, getProfiles, itemId, profileKey, readProfile, shownProfile, tableName, type ItemKey, type StoredItem, type Viewer } from "./profile-storage";
import { CONTACT_FIELDS, profileHref, type Contacts } from "./profile-model";
import { DECLINE_COOLDOWN_MS, MAX_PENDING_OUTGOING, REQUEST_MESSAGE_MAX_LENGTH, requestMessage, type Connection, type ConnectionOutcome, type ConnectionsOverview, type IncomingRequest, type RelatedStudent, type Relationship, type SentRequest } from "./connection-model";

const RELATIONSHIP_PREFIX = "RELATIONSHIP#";
const ATTEMPTS = 5;
type TransactItems = NonNullable<TransactWriteCommandInput["TransactItems"]>;
type TransactItem = TransactItems[number];

/**
 * What two students have between them, stored once per pair and copied into
 * each student's partition: a pending Connection Request, a declined one still
 * in its cooldown, or a Connection.
 */
type PairRecord = { sender: string; recipient: string; requestId: string; courseCode: string } & (
  | { status: "pending"; message: string; createdAt: string }
  | { status: "declined"; until: string }
) | { status: "connected"; students: [string, string]; courseCode: string; connectedAt: string };

function pairKey(a: string, b: string): ItemKey {
  const [first, second] = [a, b].sort();
  return { pk: `PAIR#${first}#${second}`, sk: "RELATIONSHIP" };
}

function relationshipKey(studentId: string, otherId: string): ItemKey {
  return { pk: profileKey(studentId).pk, sk: `${RELATIONSHIP_PREFIX}${otherId}` };
}

/** The same write to the pair's item in each student's partition. */
function inBothPartitions(a: string, b: string, write: (key: ItemKey, owner: string) => TransactItem): TransactItem[] {
  return [write(relationshipKey(a, b), a), write(relationshipKey(b, a), b)];
}

/** The student in `pair` who isn't `studentId`. */
function otherStudent(pair: PairRecord, studentId: string) {
  if (pair.status === "connected") return pair.students[0] === studentId ? pair.students[1] : pair.students[0];
  return pair.sender === studentId ? pair.recipient : pair.sender;
}

const PAIR_FIELDS = ["sender", "recipient", "requestId", "courseCode", "status", "message", "createdAt", "until", "connectedAt", "students"];

function readPair(item: StoredItem | undefined): PairRecord | null {
  if (!item) return null;
  if (item.status === "connected") {
    if (!Array.isArray(item.students) || item.students.length !== 2 || !item.students.every(isUuid) || typeof item.courseCode !== "string" || typeof item.connectedAt !== "string") throw new Error("Invalid Connection item.");
    return { status: "connected", students: item.students as [string, string], courseCode: item.courseCode, connectedAt: item.connectedAt };
  }
  if (![item.sender, item.recipient, item.requestId].every(isUuid) || typeof item.courseCode !== "string") throw new Error("Invalid relationship item.");
  const base = { sender: item.sender as string, recipient: item.recipient as string, requestId: item.requestId as string, courseCode: item.courseCode };
  // The sender's own copy of a pending request has no message: only the recipient sees it.
  const message = item.message ?? "";
  if (item.status === "pending" && typeof message === "string" && typeof item.createdAt === "string") return { ...base, status: "pending", message, createdAt: item.createdAt };
  if (item.status === "declined" && typeof item.until === "string" && Number.isFinite(Date.parse(item.until))) return { ...base, status: "declined", until: item.until };
  throw new Error("Invalid relationship state.");
}

async function getPair(a: string, b: string) {
  const key = pairKey(a, b);
  return readPair((await batchGet([key], PAIR_FIELDS, { consistent: true })).get(itemId(key)));
}

export async function getRelationships(viewer: Viewer, studentIds: string[]) {
  const me = viewer.studentId;
  const ids = [...new Set(studentIds.filter(isUuid))];
  const items = await batchGet(ids.filter((id) => id !== me).map((id) => pairKey(me, id)), PAIR_FIELDS, { consistent: true });
  return new Map(ids.map((id): [string, Relationship] => {
    if (id === me) return [id, { status: "self" }];
    const pair = readPair(items.get(itemId(pairKey(me, id))));
    if (!pair) return [id, { status: "none" }];
    if (pair.status === "connected") return [id, { status: "connected" }];
    if (pair.status === "pending") return [id, pair.sender === me
      ? { status: "outgoing", requestId: pair.requestId }
      : { status: "incoming", requestId: pair.requestId, courseCode: pair.courseCode, message: pair.message }];
    // Only the declined sender waits out the cooldown; the student who declined may ask at any time.
    return [id, pair.sender === me && Date.parse(pair.until) > Date.now()
      ? { status: "declined", until: pair.until } : { status: "none" }];
  }));
}

/** The viewer's relationship with one student, read once per request however many times it is asked for. */
export const getRelationship = cache(async (viewer: Viewer, studentId: string): Promise<Relationship> =>
  (await getRelationships(viewer, [studentId])).get(studentId) ?? { status: "none" });

/** Whether the viewer and this student have a Connection, so each may see the other's contact details. */
export async function isConnected(viewer: Viewer, studentId: string) {
  return (await getRelationship(viewer, studentId)).status === "connected";
}

async function relationshipPairs(studentId: string) {
  const pairs: PairRecord[] = [];
  for await (const page of paginateQuery({ client: db }, {
    TableName: tableName(), ConsistentRead: true,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    ExpressionAttributeValues: { ":pk": profileKey(studentId).pk, ":prefix": RELATIONSHIP_PREFIX },
  })) {
    for (const item of page.Items ?? []) {
      const pair = readPair(item);
      if (pair) pairs.push(pair);
    }
  }
  return pairs;
}

async function relatedStudent(profile: NonNullable<ReturnType<typeof readProfile>>): Promise<RelatedStudent> {
  const { displayName, initials, pictureUrl } = await shownProfile(profile);
  return { id: profile.studentId, displayName, initials, pictureUrl, href: profileHref(profile.studentId) };
}

async function relatedStudents(studentIds: string[]) {
  const profiles = await getProfiles(studentIds);
  return new Map(await Promise.all([...profiles.values()].map(async (profile) => [profile.studentId, await relatedStudent(profile)] as const)));
}

/** The viewer's requests, newest first: pending ones, then declined ones still in their cooldown. */
export async function getConnectionsOverview(viewer: Viewer): Promise<ConnectionsOverview> {
  const now = Date.now();
  const me = viewer.studentId;
  const pairs = await relationshipPairs(me);
  const pending = pairs.flatMap((pair) => (pair.status === "pending" ? [pair] : [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const declined = pairs.flatMap((pair) => (pair.status === "declined" && pair.sender === me && Date.parse(pair.until) > now ? [pair] : [])).sort((a, b) => b.until.localeCompare(a.until));
  const connected = pairs.flatMap((pair) => (pair.status === "connected" ? [pair] : [])).sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));
  const [students, connectedStudents] = await Promise.all([
    relatedStudents([...pending, ...declined].map((pair) => otherStudent(pair, me))),
    withContacts(connected.map((pair) => otherStudent(pair, me))),
  ]);
  const incoming: IncomingRequest[] = [];
  const sent: SentRequest[] = [];
  for (const pair of pending) {
    const student = students.get(otherStudent(pair, me));
    if (!student) continue;
    if (pair.recipient === me) incoming.push({ student, requestId: pair.requestId, courseCode: pair.courseCode, message: pair.message });
    else sent.push({ student, courseCode: pair.courseCode, status: "pending", requestId: pair.requestId });
  }
  for (const pair of declined) {
    const student = students.get(pair.recipient);
    if (student) sent.push({ student, courseCode: pair.courseCode, status: "declined", until: pair.until });
  }
  const connections: Connection[] = connected.flatMap((pair) => {
    const found = connectedStudents.get(otherStudent(pair, me));
    return found ? [{ ...found, courseCode: pair.courseCode, connectedAt: pair.connectedAt }] : [];
  });
  return { incoming, sent, connections };
}

// Only called with the viewer's Connections: nobody else's contact details are ever read.
async function withContacts(studentIds: string[]) {
  const items = await batchGet(studentIds.map(profileKey), ["studentId", "givenName", "familyName", "pictureKey", ...CONTACT_FIELDS], { consistent: true });
  const students = new Map<string, { student: RelatedStudent; contacts: Contacts }>();
  await Promise.all([...items.values()].map(async (item) => {
    const profile = readProfile(item);
    if (profile) students.set(profile.studentId, { student: await relatedStudent(profile), contacts: profile.contacts });
  }));
  return students;
}

/** How many pending requests in this student's partition they are the `role` of. */
async function countPending(studentId: string, role: "sender" | "recipient") {
  let count = 0;
  for await (const page of paginateQuery({ client: db }, {
    TableName: tableName(), ConsistentRead: true,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    FilterExpression: "#status = :pending AND #role = :student",
    ExpressionAttributeNames: { "#status": "status", "#role": role },
    ExpressionAttributeValues: { ":pk": profileKey(studentId).pk, ":prefix": RELATIONSHIP_PREFIX, ":pending": "pending", ":student": studentId },
    Select: "COUNT",
  })) count += page.Count ?? 0;
  return count;
}

/** How many pending requests are waiting for the viewer, for the Profile badge. */
export async function countPendingIncoming(viewer: Viewer) {
  return countPending(viewer.studentId, "recipient");
}

/**
 * The sender's pending outgoing requests, counted, and the version that guards
 * the count: every send bumps it, so two sends can't both pass the limit.
 * Null when the sender has no Profile.
 */
async function pendingOutgoing(studentId: string) {
  const key = profileKey(studentId);
  const profile = (await batchGet([key], ["studentId", "connectionsVersion"], { consistent: true })).get(itemId(key));
  if (!profile || profile.studentId !== studentId) return null;
  const version = profile.connectionsVersion;
  if (version !== undefined && (!Number.isSafeInteger(version) || (version as number) < 0)) throw new Error("Invalid Connections version.");
  return { count: await countPending(studentId, "sender"), version: version as number | undefined };
}

function bumpConnectionsVersion(studentId: string, version: number | undefined): TransactItem {
  return { Update: {
    TableName: tableName(), Key: profileKey(studentId),
    // pendingOutgoingCount was a stored copy of the count that was never read
    // (removed 2026-11-20); this clears it from Profiles as their owners send.
    UpdateExpression: "SET connectionsVersion = :next REMOVE pendingOutgoingCount",
    ConditionExpression: `attribute_exists(pk) AND ${version === undefined ? "attribute_not_exists(connectionsVersion)" : "connectionsVersion = :version"}`,
    ExpressionAttributeValues: { ":next": (version ?? 0) + 1, ...(version === undefined ? {} : { ":version": version }) },
  } };
}

function profileExists(studentId: string): TransactItem {
  return { ConditionCheck: { TableName: tableName(), Key: profileKey(studentId), ConditionExpression: "attribute_exists(pk)" } };
}

async function transact(items: TransactItems) {
  try {
    await db.send(new TransactWriteCommand({ TransactItems: items, ClientRequestToken: randomUUID() }));
    return true;
  } catch (error) {
    if (error instanceof TransactionCanceledException && error.CancellationReasons?.some((r) => r.Code === "ConditionalCheckFailed" || r.Code === "TransactionConflict") && error.CancellationReasons.every((r) => !r.Code || ["None", "ConditionalCheckFailed", "TransactionConflict"].includes(r.Code))) return false;
    throw error;
  }
}

/**
 * Reads, then writes in one transaction, again from a fresh read whenever
 * something changed in between. `attempt` returns the writes, or the outcome
 * when there is nothing to write.
 */
async function commit(action: string, attempt: () => Promise<ConnectionOutcome | TransactItems>): Promise<ConnectionOutcome> {
  for (let tries = 0; tries < ATTEMPTS; tries++) {
    const writes = await attempt();
    if (!Array.isArray(writes)) return writes;
    if (await transact(writes)) return { ok: true };
    await backOff(tries);
  }
  throw new Error(`Connections changed repeatedly while ${action}. Try again.`);
}

function sendRefusal(pair: PairRecord | null, sender: string, now: number): ConnectionOutcome | null {
  if (pair?.status === "pending") return { ok: false, reason: "pending-exists" };
  if (pair?.status === "connected") return { ok: false, reason: "already-connected" };
  if (pair?.status === "declined" && pair.sender === sender && Date.parse(pair.until) > now) return { ok: false, reason: "cooldown", until: pair.until };
  return null;
}

export async function sendRequest(viewer: Viewer, recipient: string, courseCode: string, rawMessage: string): Promise<ConnectionOutcome> {
  const me = viewer.studentId;
  if (me === recipient) return { ok: false, reason: "self" };
  if (!isUuid(recipient)) return { ok: false, reason: "no-profile" };
  const message = requestMessage(rawMessage);
  if (Array.from(message).length > REQUEST_MESSAGE_MAX_LENGTH) return { ok: false, reason: "message-too-long" };
  const normalizedCode = courseCodeKey(courseCode);
  if (!normalizedCode) return { ok: false, reason: "not-volunteer" };
  const offerKey = { pk: profileKey(recipient).pk, sk: `OFFER#${normalizedCode}` };
  return commit("sending", async () => {
    const now = new Date();
    const refusal = sendRefusal(await getPair(me, recipient), me, now.getTime());
    if (refusal) return refusal;
    const eligibility = await batchGet([profileKey(recipient), offerKey], ["studentId", "courseCode"], { consistent: true });
    if (!eligibility.has(itemId(profileKey(recipient)))) return { ok: false, reason: "no-profile" };
    const offer = eligibility.get(itemId(offerKey));
    if (!offer || typeof offer.courseCode !== "string") return { ok: false, reason: "not-volunteer" };
    const outgoing = await pendingOutgoing(me);
    if (!outgoing) return { ok: false, reason: "no-profile" };
    if (outgoing.count >= MAX_PENDING_OUTGOING) return { ok: false, reason: "limit" };
    // The sender's own copy leaves out the message: only the recipient sees it.
    const senderCopy = { sender: me, recipient, requestId: randomUUID(), status: "pending", courseCode: offer.courseCode, createdAt: now.toISOString() } as const;
    const pair: PairRecord = { ...senderCopy, message };
    return [
      { Put: { TableName: tableName(), Item: { ...pairKey(me, recipient), ...pair },
        // A decline ends with its cooldown, or at once when the student who declined asks.
        ConditionExpression: "attribute_not_exists(pk) OR (#status = :declined AND (#until <= :now OR recipient = :me))",
        ExpressionAttributeNames: { "#status": "status", "#until": "until" },
        ExpressionAttributeValues: { ":declined": "declined", ":now": now.toISOString(), ":me": me } } },
      ...inBothPartitions(me, recipient, (key, owner) => ({ Put: { TableName: tableName(), Item: { ...key, ...(owner === recipient ? pair : senderCopy) } } })),
      bumpConnectionsVersion(me, outgoing.version),
      profileExists(recipient),
      { ConditionCheck: { TableName: tableName(), Key: offerKey, ConditionExpression: "attribute_exists(pk) AND courseCode = :course", ExpressionAttributeValues: { ":course": offer.courseCode } } },
    ];
  });
}

export async function withdrawRequest(viewer: Viewer, otherId: string, requestId: string): Promise<ConnectionOutcome> {
  const me = viewer.studentId;
  if (!isUuid(otherId) || !isUuid(requestId) || otherId === me) return { ok: false, reason: "not-found" };
  return commit("withdrawing", async () => {
    const pair = await getPair(me, otherId);
    if (pair?.status !== "pending" || pair.sender !== me || pair.requestId !== requestId) return { ok: false, reason: "not-found" };
    return [
      { Delete: { TableName: tableName(), Key: pairKey(me, otherId),
        ConditionExpression: "#status = :pending AND requestId = :id AND sender = :sender",
        ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":pending": "pending", ":id": requestId, ":sender": me } } },
      ...inBothPartitions(me, otherId, (Key) => ({ Delete: { TableName: tableName(), Key } })),
    ];
  });
}

async function respondToRequest(viewer: Viewer, otherId: string, requestId: string, decision: "accept" | "decline"): Promise<ConnectionOutcome> {
  const me = viewer.studentId;
  if (!isUuid(otherId) || !isUuid(requestId) || otherId === me) return { ok: false, reason: "not-found" };
  return commit(decision === "accept" ? "accepting" : "declining", async () => {
    const pair = await getPair(me, otherId);
    if (pair?.status !== "pending" || pair.recipient !== me || pair.sender !== otherId || pair.requestId !== requestId) return { ok: false, reason: "not-found" };
    const now = Date.now();
    const until = new Date(now + DECLINE_COOLDOWN_MS).toISOString();
    const next = decision === "accept"
      ? { status: "connected", students: [pair.sender, pair.recipient].sort(), courseCode: pair.courseCode, connectedAt: new Date(now).toISOString() }
      // DynamoDB's TTL deletes a decline once its cooldown is over, so no history is kept.
      : { status: "declined", sender: pair.sender, recipient: pair.recipient, requestId, courseCode: pair.courseCode, until, expiresAt: Math.ceil(Date.parse(until) / 1000) };
    return [
      { Put: { TableName: tableName(), Item: { ...pairKey(pair.sender, pair.recipient), ...next },
        ConditionExpression: "#status = :pending AND requestId = :id AND recipient = :recipient",
        ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":pending": "pending", ":id": requestId, ":recipient": me } } },
      ...inBothPartitions(pair.sender, pair.recipient, (key) => ({ Put: { TableName: tableName(), Item: { ...key, ...next } } })),
      // Neither student is part way through deleting their account.
      profileExists(pair.sender),
      profileExists(pair.recipient),
    ];
  });
}

export async function acceptRequest(viewer: Viewer, otherId: string, requestId: string): Promise<ConnectionOutcome> {
  return respondToRequest(viewer, otherId, requestId, "accept");
}

export async function declineRequest(viewer: Viewer, otherId: string, requestId: string): Promise<ConnectionOutcome> {
  return respondToRequest(viewer, otherId, requestId, "decline");
}

export async function removeConnection(viewer: Viewer, otherId: string): Promise<ConnectionOutcome> {
  const me = viewer.studentId;
  if (!isUuid(otherId) || otherId === me) return { ok: false, reason: "not-found" };
  return commit("removing", async () => {
    if ((await getPair(me, otherId))?.status !== "connected") return { ok: false, reason: "not-found" };
    return [
      { Delete: { TableName: tableName(), Key: pairKey(me, otherId),
        ConditionExpression: "#status = :connected", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":connected": "connected" } } },
      ...inBothPartitions(me, otherId, (Key) => ({ Delete: { TableName: tableName(), Key } })),
    ];
  });
}

/** Deletes the pair item only if it is still in the state that was read. */
function unchanged(pair: PairRecord | null) {
  if (!pair) return { ConditionExpression: "attribute_not_exists(pk)" };
  if (pair.status === "connected") return { ConditionExpression: "#status = :status", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":status": "connected" } };
  return { ConditionExpression: "#status = :status AND requestId = :id", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":status": pair.status, ":id": pair.requestId } };
}

/**
 * Deletes every Connection Request and Connection the viewer is part of, from
 * both students' partitions. For account deletion (#51).
 */
export async function deleteRequestsAndConnections(viewer: Viewer) {
  const me = viewer.studentId;
  const others = new Set((await relationshipPairs(me)).map((pair) => otherStudent(pair, me)));
  for (const other of others) {
    await commit("deleting Connection Requests and Connections", async () => [
      { Delete: { TableName: tableName(), Key: pairKey(me, other), ...unchanged(await getPair(me, other)) } },
      ...inBothPartitions(me, other, (Key) => ({ Delete: { TableName: tableName(), Key } })),
    ]);
  }
}
