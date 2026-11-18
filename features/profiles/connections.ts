import "server-only";
import { cache } from "react";
import { randomUUID } from "node:crypto";
import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { BatchGetCommand, paginateQuery, TransactWriteCommand, type BatchGetCommandOutput, type TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { db } from "@/lib/dynamodb";
import { isUuid } from "@/lib/uuid";
import { courseCodeKey } from "@/features/courses/course-model";
import { getProfiles, profileKey, readProfile, shownProfile, tableName, type Viewer } from "./profile-storage";
import { CONTACT_FIELDS, profileHref, type Contacts } from "./profile-model";
import { DECLINE_COOLDOWN_MS, MAX_PENDING_OUTGOING, REQUEST_MESSAGE_MAX_LENGTH, requestMessage, type Connection, type ConnectionOutcome, type ConnectionsOverview, type IncomingRequest, type RelatedStudent, type Relationship, type SentRequest } from "./connection-model";

const RELATIONSHIP_PREFIX = "RELATIONSHIP#";
const ATTEMPTS = 5;
type Key = { pk: string; sk: string };
type Item = Record<string, unknown>;
type Pair = { sender: string; recipient: string; requestId: string; courseCode: string } & (
  | { status: "pending"; message: string; createdAt: string }
  | { status: "declined"; until: string }
) | { status: "connected"; students: [string, string]; courseCode: string; connectedAt: string };

function pairKey(a: string, b: string): Key {
  const [first, second] = [a, b].sort();
  return { pk: `PAIR#${first}#${second}`, sk: "RELATIONSHIP" };
}

function relationshipKey(studentId: string, otherId: string): Key {
  return { pk: profileKey(studentId).pk, sk: `${RELATIONSHIP_PREFIX}${otherId}` };
}

function keyId(key: Key) {
  return `${key.pk}/${key.sk}`;
}

async function readItems(keys: Key[], fields: string[]) {
  const items = new Map<string, Item>();
  const unique = [...new Map(keys.map((key) => [keyId(key), key])).values()];
  const table = tableName();
  for (let offset = 0; offset < unique.length; offset += 100) {
    let remaining: Record<string, unknown>[] = unique.slice(offset, offset + 100);
    for (let attempt = 0; remaining.length; attempt++) {
      if (attempt === ATTEMPTS) throw new Error("DynamoDB kept leaving relationships unread.");
      if (attempt) await pause(attempt);
      const result: BatchGetCommandOutput = await db.send(new BatchGetCommand({ RequestItems: {
        [table]: {
          Keys: remaining, ConsistentRead: true,
          ProjectionExpression: ["pk", "sk", ...fields].map((_, i) => `#f${i}`).join(", "),
          ExpressionAttributeNames: Object.fromEntries(["pk", "sk", ...fields].map((field, i) => [`#f${i}`, field])),
        },
      } }));
      for (const item of result.Responses?.[table] ?? []) items.set(keyId(item as Key), item);
      remaining = result.UnprocessedKeys?.[table]?.Keys ?? [];
    }
  }
  return items;
}

const PAIR_FIELDS = ["sender", "recipient", "requestId", "courseCode", "status", "message", "createdAt", "until", "connectedAt", "students"];

function readPair(item: Item | undefined): Pair | null {
  if (!item) return null;
  if (item.status === "connected") {
    if (!Array.isArray(item.students) || item.students.length !== 2 || !item.students.every(isUuid) || typeof item.courseCode !== "string" || typeof item.connectedAt !== "string") throw new Error("Invalid Connection item.");
    return { status: "connected", students: item.students as [string, string], courseCode: item.courseCode, connectedAt: item.connectedAt };
  }
  if (![item.sender, item.recipient, item.requestId].every(isUuid) || typeof item.courseCode !== "string") throw new Error("Invalid relationship item.");
  const base = { sender: item.sender as string, recipient: item.recipient as string, requestId: item.requestId as string, courseCode: item.courseCode };
  if (item.status === "pending" && typeof item.message === "string" && typeof item.createdAt === "string") return { ...base, status: "pending", message: item.message, createdAt: item.createdAt };
  if (item.status === "declined" && typeof item.until === "string" && Number.isFinite(Date.parse(item.until))) return { ...base, status: "declined", until: item.until };
  throw new Error("Invalid relationship state.");
}

async function getPair(a: string, b: string) {
  const key = pairKey(a, b);
  return readPair((await readItems([key], PAIR_FIELDS)).get(keyId(key)));
}

export async function getRelationships(viewer: Viewer, studentIds: string[]) {
  const ids = [...new Set(studentIds.filter(isUuid))];
  const items = await readItems(ids.filter((id) => id !== viewer.studentId).map((id) => pairKey(viewer.studentId, id)), PAIR_FIELDS);
  return new Map(ids.map((id): [string, Relationship] => {
    if (id === viewer.studentId) return [id, { status: "self" }];
    const pair = readPair(items.get(keyId(pairKey(viewer.studentId, id))));
    if (!pair) return [id, { status: "none" }];
    if (pair.status === "connected") return [id, { status: "connected" }];
    if (pair.status === "pending") return [id, pair.sender === viewer.studentId
      ? { status: "outgoing", requestId: pair.requestId }
      : { status: "incoming", requestId: pair.requestId, courseCode: pair.courseCode, message: pair.message }];
    return [id, pair.sender === viewer.studentId && Date.parse(pair.until) > Date.now()
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
  const pairs: Pair[] = [];
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

async function relatedStudents(studentIds: string[]) {
  const students = new Map<string, RelatedStudent>();
  const ids = [...new Set(studentIds)];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const profiles = await getProfiles(ids.slice(offset, offset + 100));
    await Promise.all([...profiles.values()].map(async (profile) => {
      const { displayName, initials, pictureUrl } = await shownProfile(profile);
      students.set(profile.studentId, { id: profile.studentId, displayName, initials, pictureUrl, href: profileHref(profile.studentId) });
    }));
  }
  return students;
}

/** The viewer's requests, newest first: pending ones, then declined ones still in their cooldown. */
export async function getConnectionsOverview(viewer: Viewer): Promise<ConnectionsOverview> {
  const now = Date.now();
  const me = viewer.studentId;
  const pairs = await relationshipPairs(me);
  const pending = pairs.flatMap((pair) => (pair.status === "pending" ? [pair] : [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const declined = pairs.flatMap((pair) => (pair.status === "declined" && pair.sender === me && Date.parse(pair.until) > now ? [pair] : [])).sort((a, b) => b.until.localeCompare(a.until));
  const students = await relatedStudents([...pending, ...declined].map((pair) => (pair.sender === me ? pair.recipient : pair.sender)));
  const incoming: IncomingRequest[] = [];
  const sent: SentRequest[] = [];
  for (const pair of pending) {
    const student = students.get(pair.sender === me ? pair.recipient : pair.sender);
    if (!student) continue;
    if (pair.recipient === me) incoming.push({ student, requestId: pair.requestId, courseCode: pair.courseCode, message: pair.message });
    else sent.push({ student, courseCode: pair.courseCode, status: "pending", requestId: pair.requestId });
  }
  for (const pair of declined) {
    const student = students.get(pair.recipient);
    if (student) sent.push({ student, courseCode: pair.courseCode, status: "declined", until: pair.until });
  }
  const connected = pairs.flatMap((pair) => (pair.status === "connected" ? [pair] : [])).sort((a, b) => b.connectedAt.localeCompare(a.connectedAt));
  const otherOf = (pair: (typeof connected)[number]) => pair.students.find((id) => id !== me)!;
  const connectedStudents = await withContacts(connected.map(otherOf));
  const connections: Connection[] = connected.flatMap((pair) => {
    const found = connectedStudents.get(otherOf(pair));
    return found ? [{ ...found, courseCode: pair.courseCode, connectedAt: pair.connectedAt }] : [];
  });
  return { incoming, sent, connections };
}

// Only called with the viewer's Connections: nobody else's contact details are ever read.
async function withContacts(studentIds: string[]) {
  const items = await readItems(studentIds.map(profileKey), ["studentId", "givenName", "familyName", "pictureKey", ...CONTACT_FIELDS]);
  const students = new Map<string, { student: RelatedStudent; contacts: Contacts }>();
  await Promise.all([...items.values()].map(async (item) => {
    const profile = readProfile(item);
    if (!profile) return;
    const { displayName, initials, pictureUrl } = await shownProfile(profile);
    students.set(profile.studentId, { student: { id: profile.studentId, displayName, initials, pictureUrl, href: profileHref(profile.studentId) }, contacts: profile.contacts });
  }));
  return students;
}

/** How many pending requests are waiting for the viewer, for the Profile tab's badge. */
export async function countPendingIncoming(viewer: Viewer) {
  let count = 0;
  for await (const page of paginateQuery({ client: db }, {
    TableName: tableName(), ConsistentRead: true,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    FilterExpression: "#status = :pending AND recipient = :me",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":pk": profileKey(viewer.studentId).pk, ":prefix": RELATIONSHIP_PREFIX, ":pending": "pending", ":me": viewer.studentId },
    Select: "COUNT",
  })) count += page.Count ?? 0;
  return count;
}

async function outgoingSnapshot(studentId: string) {
  const key = profileKey(studentId);
  const profile = (await readItems([key], ["studentId", "connectionsVersion"])).get(keyId(key));
  if (!profile || profile.studentId !== studentId) return null;
  const version = profile.connectionsVersion;
  if (version !== undefined && (!Number.isSafeInteger(version) || (version as number) < 0)) throw new Error("Invalid Connections version.");
  let count = 0;
  for await (const page of paginateQuery({ client: db }, {
    TableName: tableName(), ConsistentRead: true,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    FilterExpression: "#status = :pending AND sender = :sender",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":pk": key.pk, ":prefix": RELATIONSHIP_PREFIX, ":pending": "pending", ":sender": studentId },
    Select: "COUNT",
  })) count += page.Count ?? 0;
  return { count, version: version as number | undefined };
}

function counterUpdate(studentId: string, snapshot: NonNullable<Awaited<ReturnType<typeof outgoingSnapshot>>>, delta: number) {
  // The version guards the whole paginated recount, repairing drift without losing concurrent changes.
  return { Update: {
    TableName: tableName(), Key: profileKey(studentId),
    UpdateExpression: "SET pendingOutgoingCount = :count, connectionsVersion = :next",
    ConditionExpression: `attribute_exists(pk) AND ${snapshot.version === undefined ? "attribute_not_exists(connectionsVersion)" : "connectionsVersion = :version"}`,
    ExpressionAttributeValues: {
      ":count": Math.max(0, snapshot.count + delta), ":next": (snapshot.version ?? 0) + 1,
      ...(snapshot.version === undefined ? {} : { ":version": snapshot.version }),
    },
  } };
}

function pause(attempt: number) {
  return new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
}

async function transact(items: NonNullable<TransactWriteCommandInput["TransactItems"]>) {
  try {
    await db.send(new TransactWriteCommand({ TransactItems: items, ClientRequestToken: randomUUID() }));
    return true;
  } catch (error) {
    if (error instanceof TransactionCanceledException && error.CancellationReasons?.some((r) => r.Code === "ConditionalCheckFailed" || r.Code === "TransactionConflict") && error.CancellationReasons.every((r) => !r.Code || ["None", "ConditionalCheckFailed", "TransactionConflict"].includes(r.Code))) return false;
    throw error;
  }
}

function sendRefusal(pair: Pair | null, now: number): ConnectionOutcome | null {
  if (pair?.status === "pending") return { ok: false, reason: "pending-exists" };
  if (pair?.status === "connected") return { ok: false, reason: "already-connected" };
  if (pair?.status === "declined" && Date.parse(pair.until) > now) return { ok: false, reason: "cooldown", until: pair.until };
  return null;
}

export async function sendRequest(viewer: Viewer, recipient: string, courseCode: string, rawMessage: string): Promise<ConnectionOutcome> {
  if (viewer.studentId === recipient) return { ok: false, reason: "self" };
  if (!isUuid(recipient)) return { ok: false, reason: "no-profile" };
  const message = requestMessage(rawMessage);
  if (Array.from(message).length > REQUEST_MESSAGE_MAX_LENGTH) return { ok: false, reason: "message-too-long" };
  const normalizedCode = courseCodeKey(courseCode);
  if (!normalizedCode) return { ok: false, reason: "not-volunteer" };
  const offerKey = { pk: profileKey(recipient).pk, sk: `OFFER#${normalizedCode}` };
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const now = new Date();
    const refusal = sendRefusal(await getPair(viewer.studentId, recipient), now.getTime());
    if (refusal) return refusal;
    const eligibility = await readItems([profileKey(recipient), offerKey], ["studentId", "courseCode"]);
    if (!eligibility.has(keyId(profileKey(recipient)))) return { ok: false, reason: "no-profile" };
    const offer = eligibility.get(keyId(offerKey));
    if (!offer || typeof offer.courseCode !== "string") return { ok: false, reason: "not-volunteer" };
    const snapshot = await outgoingSnapshot(viewer.studentId);
    if (!snapshot) return { ok: false, reason: "no-profile" };
    if (snapshot.count >= MAX_PENDING_OUTGOING) return { ok: false, reason: "limit" };
    const pair: Pair = { sender: viewer.studentId, recipient, requestId: randomUUID(), status: "pending", courseCode: offer.courseCode, message, createdAt: now.toISOString() };
    if (await transact([
      { Put: { TableName: tableName(), Item: { ...pairKey(viewer.studentId, recipient), ...pair },
        ConditionExpression: "attribute_not_exists(pk) OR (#status = :declined AND #until <= :now)",
        ExpressionAttributeNames: { "#status": "status", "#until": "until" },
        ExpressionAttributeValues: { ":declined": "declined", ":now": now.toISOString() } } },
      { Put: { TableName: tableName(), Item: { ...relationshipKey(pair.sender, pair.recipient), ...pair } } },
      { Put: { TableName: tableName(), Item: { ...relationshipKey(pair.recipient, pair.sender), ...pair } } },
      counterUpdate(viewer.studentId, snapshot, 1),
      { ConditionCheck: { TableName: tableName(), Key: profileKey(recipient), ConditionExpression: "attribute_exists(pk)" } },
      { ConditionCheck: { TableName: tableName(), Key: offerKey, ConditionExpression: "attribute_exists(pk) AND courseCode = :course", ExpressionAttributeValues: { ":course": offer.courseCode } } },
    ])) return { ok: true };
    await pause(attempt);
  }
  throw new Error("Connections changed repeatedly while sending. Try again.");
}

export async function withdrawRequest(viewer: Viewer, otherId: string, requestId: string): Promise<ConnectionOutcome> {
  if (!isUuid(otherId) || !isUuid(requestId) || otherId === viewer.studentId) return { ok: false, reason: "not-found" };
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const pair = await getPair(viewer.studentId, otherId);
    if (pair?.status !== "pending" || pair.sender !== viewer.studentId || pair.requestId !== requestId) return { ok: false, reason: "not-found" };
    const snapshot = await outgoingSnapshot(pair.sender);
    if (!snapshot) return { ok: false, reason: "no-profile" };
    if (await transact([
      { Delete: { TableName: tableName(), Key: pairKey(pair.sender, pair.recipient),
        ConditionExpression: "#status = :pending AND requestId = :id AND sender = :sender",
        ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":pending": "pending", ":id": requestId, ":sender": viewer.studentId } } },
      { Delete: { TableName: tableName(), Key: relationshipKey(pair.sender, pair.recipient) } },
      { Delete: { TableName: tableName(), Key: relationshipKey(pair.recipient, pair.sender) } },
      counterUpdate(pair.sender, snapshot, -1),
    ])) return { ok: true };
    await pause(attempt);
  }
  throw new Error("Connections changed repeatedly while withdrawing. Try again.");
}

async function respondToRequest(viewer: Viewer, otherId: string, requestId: string, decision: "accept" | "decline"): Promise<ConnectionOutcome> {
  if (!isUuid(otherId) || !isUuid(requestId) || otherId === viewer.studentId) return { ok: false, reason: "not-found" };
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const pair = await getPair(viewer.studentId, otherId);
    if (pair?.status !== "pending" || pair.recipient !== viewer.studentId || pair.sender !== otherId || pair.requestId !== requestId) return { ok: false, reason: "not-found" };
    const snapshot = await outgoingSnapshot(pair.sender);
    if (!snapshot) return { ok: false, reason: "no-profile" };
    const now = Date.now();
    const next: Pair = decision === "accept"
      ? { status: "connected", students: [pair.sender, pair.recipient].sort() as [string, string], courseCode: pair.courseCode, connectedAt: new Date(now).toISOString() }
      : { status: "declined", sender: pair.sender, recipient: pair.recipient, requestId, courseCode: pair.courseCode, until: new Date(now + DECLINE_COOLDOWN_MS).toISOString() };
    // DynamoDB's TTL deletes a decline once its cooldown is over, so no history is kept.
    const stored = next.status === "declined" ? { ...next, expiresAt: Math.ceil(Date.parse(next.until) / 1000) } : next;
    if (await transact([
      { Put: { TableName: tableName(), Item: { ...pairKey(pair.sender, pair.recipient), ...stored },
        ConditionExpression: "#status = :pending AND requestId = :id AND recipient = :recipient",
        ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":pending": "pending", ":id": requestId, ":recipient": viewer.studentId } } },
      { Put: { TableName: tableName(), Item: { ...relationshipKey(pair.sender, pair.recipient), ...stored } } },
      { Put: { TableName: tableName(), Item: { ...relationshipKey(pair.recipient, pair.sender), ...stored } } },
      counterUpdate(pair.sender, snapshot, -1),
      { ConditionCheck: { TableName: tableName(), Key: profileKey(pair.recipient), ConditionExpression: "attribute_exists(pk)" } },
    ])) return { ok: true };
    await pause(attempt);
  }
  throw new Error("Connections changed repeatedly while responding. Try again.");
}

export async function acceptRequest(viewer: Viewer, otherId: string, requestId: string): Promise<ConnectionOutcome> {
  return respondToRequest(viewer, otherId, requestId, "accept");
}

export async function declineRequest(viewer: Viewer, otherId: string, requestId: string): Promise<ConnectionOutcome> {
  return respondToRequest(viewer, otherId, requestId, "decline");
}

export async function removeConnection(viewer: Viewer, otherId: string): Promise<ConnectionOutcome> {
  if (!isUuid(otherId) || otherId === viewer.studentId) return { ok: false, reason: "not-found" };
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if ((await getPair(viewer.studentId, otherId))?.status !== "connected") return { ok: false, reason: "not-found" };
    if (await transact([
      { Delete: { TableName: tableName(), Key: pairKey(viewer.studentId, otherId),
        ConditionExpression: "#status = :connected", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":connected": "connected" } } },
      { Delete: { TableName: tableName(), Key: relationshipKey(viewer.studentId, otherId) } },
      { Delete: { TableName: tableName(), Key: relationshipKey(otherId, viewer.studentId) } },
    ])) return { ok: true };
    await pause(attempt);
  }
  throw new Error("Connections changed repeatedly while removing. Try again.");
}

function pairCondition(pair: Pair) {
  if (pair.status === "connected") return { ConditionExpression: "#status = :status", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":status": "connected" } };
  return { ConditionExpression: "#status = :status AND requestId = :id", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":status": pair.status, ":id": pair.requestId } };
}

/**
 * Deletes every request and Connection the viewer is part of, from both
 * students' partitions, and corrects the counts of students whose pending
 * requests to the viewer are deleted. For account deletion (#51).
 */
export async function deleteAllConnections(viewer: Viewer) {
  const me = viewer.studentId;
  const others = new Set((await relationshipPairs(me)).map((pair) => (pair.status === "connected" ? pair.students.find((id) => id !== me)! : pair.sender === me ? pair.recipient : pair.sender)));
  for (const other of others) {
    for (let attempt = 0; ; attempt++) {
      if (attempt === ATTEMPTS) throw new Error("Connections changed repeatedly while deleting them. Try again.");
      const pair = await getPair(me, other);
      const snapshot = pair?.status === "pending" && pair.sender === other ? await outgoingSnapshot(other) : null;
      if (await transact([
        pair ? { Delete: { TableName: tableName(), Key: pairKey(me, other), ...pairCondition(pair) } }
          : { Delete: { TableName: tableName(), Key: pairKey(me, other), ConditionExpression: "attribute_not_exists(pk)" } },
        { Delete: { TableName: tableName(), Key: relationshipKey(me, other) } },
        { Delete: { TableName: tableName(), Key: relationshipKey(other, me) } },
        ...(snapshot ? [counterUpdate(other, snapshot, -1)] : []),
      ])) break;
      await pause(attempt);
    }
  }
}
