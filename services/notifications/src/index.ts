import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import type {
  DynamoDBBatchResponse,
  DynamoDBRecord,
  DynamoDBStreamEvent,
  AttributeValue as StreamValue,
} from "aws-lambda";

import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  ConditionalCheckFailedException,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import {
  BatchGetCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// Sends a Notification for each Connection Request event in the profiles
// table's stream. The stream's filter passes only the pair items
// (`PAIR#<id>#<id>`), which hold each pair of students' current state.

const region = process.env.AWS_REGION || "us-east-1";
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const cognito = new CognitoIdentityProviderClient({ region });
const ses = new SESv2Client({ region });

/** A "sent" marker is kept long enough to outlast every retry of its record. */
const MARKER_TTL_SECONDS = 7 * 24 * 60 * 60;

function setting(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

type Kind = "requested" | "accepted" | "declined";

/** One Connection Request event, worth one Notification. */
export interface RequestEvent {
  kind: Kind;
  requestId: string;
  /** The student who sent the Connection Request. */
  sender: string;
  /** The Volunteer it was sent to. */
  recipient: string;
}

type Item = Record<string, unknown>;

function image(
  value: Record<string, StreamValue> | undefined,
): Item | undefined {
  return value
    ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- stream images use DynamoDB's own attribute format, which aws-lambda types more loosely than the SDK.
      unmarshall(value as Record<string, AttributeValue>)
    : undefined;
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/** The event a change to a pair item is, or null when it sends nothing. */
export function eventFrom(
  before: Item | undefined,
  after: Item | undefined,
): RequestEvent | null {
  // A new request, including one sent again after a decline.
  if (
    after?.status === "pending" &&
    !(before?.status === "pending" && before.requestId === after.requestId)
  ) {
    return requestEvent("requested", after);
  }
  if (before?.status !== "pending") {
    return null;
  }
  if (after?.status === "connected") {
    return requestEvent("accepted", before);
  }
  if (after?.status === "declined" && after.requestId === before.requestId) {
    return requestEvent("declined", before);
  }
  // Withdrawn requests and removed Connections send nothing.
  return null;
}

function requestEvent(kind: Kind, pair: Item): RequestEvent | null {
  const { requestId, sender, recipient } = pair;
  if (!isText(requestId) || !isText(sender) || !isText(recipient)) {
    return null;
  }
  return { kind, requestId, sender, recipient };
}

function pairKey(a: string, b: string) {
  const [first, second] = a < b ? [a, b] : [b, a];
  return { pk: `PAIR#${first}#${second}`, sk: "RELATIONSHIP" };
}

function profileKey(studentId: string) {
  return { pk: `STUDENT#${studentId}`, sk: "PROFILE" };
}

/**
 * The pair as it is now, when the event still holds: the request wasn't
 * withdrawn, or answered differently, before this ran.
 */
async function currentPair(event: RequestEvent) {
  const { Item: pair } = await db.send(
    new GetCommand({
      TableName: setting("PROFILES_TABLE_NAME"),
      Key: pairKey(event.sender, event.recipient),
      ConsistentRead: true,
    }),
  );
  if (!pair) {
    return null;
  }
  if (event.kind === "accepted") {
    const students: unknown = pair.students;
    return pair.status === "connected" &&
      Array.isArray(students) &&
      students.includes(event.sender) &&
      students.includes(event.recipient)
      ? pair
      : null;
  }
  const status = event.kind === "requested" ? "pending" : "declined";
  return pair.status === status && pair.requestId === event.requestId
    ? pair
    : null;
}

interface Profile {
  displayName: string;
  emailNotifications: boolean;
}

function firstLetter(name: string) {
  return Array.from(name)[0]?.toUpperCase() ?? "";
}

/** Both students' Profiles, or null when either has none (an account being deleted). */
async function profiles(
  a: string,
  b: string,
): Promise<[Profile, Profile] | null> {
  const table = setting("PROFILES_TABLE_NAME");
  const { Responses } = await db.send(
    new BatchGetCommand({
      RequestItems: {
        [table]: {
          Keys: [profileKey(a), profileKey(b)],
          ProjectionExpression:
            "studentId, givenName, familyName, emailNotifications",
          ConsistentRead: true,
        },
      },
    }),
  );
  const found = new Map<string, Profile>();
  for (const item of Responses?.[table] ?? []) {
    const { studentId, givenName, familyName } = item;
    if (isText(studentId) && isText(givenName)) {
      // "First L.", as Profiles show names: never the full last name.
      const initial = firstLetter(isText(familyName) ? familyName : "");
      found.set(studentId, {
        displayName: oneLine(initial ? `${givenName} ${initial}.` : givenName),
        emailNotifications: item.emailNotifications !== false,
      });
    }
  }
  const first = found.get(a);
  const second = found.get(b);
  return first && second ? [first, second] : null;
}

/** The student's verified account email, or null when they have none. */
async function accountEmail(studentId: string) {
  const { Users = [] } = await cognito.send(
    new ListUsersCommand({
      UserPoolId: setting("USER_POOL_ID"),
      Filter: `sub = "${studentId}"`,
      Limit: 1,
    }),
  );
  const user = Users[0];
  if (!user?.Enabled) {
    return null;
  }
  const attribute = (name: string) =>
    user.Attributes?.find((entry) => entry.Name === name)?.Value;
  const email = attribute("email");
  return email && attribute("email_verified") === "true" ? email : null;
}

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export interface Email {
  subject: string;
  body: string;
}

/** The Notification's subject and plain-text body. */
export function emailFor(
  event: RequestEvent,
  details: {
    /** The student the email is about. */
    other: string;
    courseCode: string;
    message: string;
    /** The reader's own Profile page. */
    ownProfileUrl: string;
    /** The other student's Profile page. */
    otherProfileUrl: string;
  },
): Email {
  const { other, courseCode, message, ownProfileUrl, otherProfileUrl } =
    details;
  const footer = [
    "",
    "--",
    "You're getting this because you have a FindMyStudents profile.",
    `Turn these emails off in your Profile settings: ${ownProfileUrl}`,
  ];
  const lines = (...body: string[]) => [...body, ...footer].join("\n");
  switch (event.kind) {
    case "requested":
      return {
        subject: `${other} wants to connect about ${courseCode}`,
        body: lines(
          `${other} sent you a Connection Request about ${courseCode}.`,
          "",
          ...(message.trim()
            ? ["Their message:", "", message.trim()]
            : ["They didn't add a message."]),
          "",
          "Accept or decline it on your profile:",
          ownProfileUrl,
        ),
      };
    case "accepted":
      return {
        subject: `${other} accepted your Connection Request`,
        body: lines(
          `${other} accepted your Connection Request about ${courseCode}.`,
          "",
          "You can now see each other's contact details on your profiles:",
          otherProfileUrl,
        ),
      };
    case "declined":
      return {
        subject: `${other} declined your Connection Request`,
        body: lines(
          `${other} declined your Connection Request about ${courseCode}.`,
          "",
          "See your Connection Requests on your profile:",
          ownProfileUrl,
        ),
      };
  }
}

function markerKey(event: RequestEvent) {
  return { pk: `NOTIFICATION#${event.requestId}`, sk: event.kind };
}

/** Claims the event, so a retried record never sends it twice. False when it was already sent. */
async function claim(event: RequestEvent) {
  try {
    await db.send(
      new PutCommand({
        TableName: setting("PROFILES_TABLE_NAME"),
        Item: {
          ...markerKey(event),
          expiresAt: Math.ceil(Date.now() / 1000) + MARKER_TTL_SECONDS,
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
    return true;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return false;
    }
    throw error;
  }
}

async function release(event: RequestEvent) {
  await db.send(
    new DeleteCommand({
      TableName: setting("PROFILES_TABLE_NAME"),
      Key: markerKey(event),
    }),
  );
}

async function notify(event: RequestEvent) {
  const pair = await currentPair(event);
  if (!pair) {
    console.info("Skipped: the request changed", event);
    return;
  }
  // A new request goes to its recipient; an answer goes back to its sender.
  const [to, about] =
    event.kind === "requested"
      ? [event.recipient, event.sender]
      : [event.sender, event.recipient];
  const found = await profiles(to, about);
  if (!found) {
    console.info("Skipped: a Profile is gone", event);
    return;
  }
  const [reader, other] = found;
  if (!reader.emailNotifications) {
    console.info("Skipped: Notifications are off", event);
    return;
  }
  const address = await accountEmail(to);
  if (!address) {
    console.info("Skipped: no verified email", event);
    return;
  }
  if (!(await claim(event))) {
    console.info("Skipped: already sent", event);
    return;
  }
  const appUrl = setting("APP_URL").replace(/\/+$/, "");
  const email = emailFor(event, {
    other: other.displayName,
    courseCode: oneLine(String(pair.courseCode ?? "")),
    message: event.kind === "requested" ? String(pair.message ?? "") : "",
    ownProfileUrl: `${appUrl}/students/${to}`,
    otherProfileUrl: `${appUrl}/students/${about}`,
  });
  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: setting("FROM_ADDRESS"),
        Destination: { ToAddresses: [address] },
        Content: {
          Simple: {
            Subject: { Data: email.subject, Charset: "UTF-8" },
            Body: { Text: { Data: email.body, Charset: "UTF-8" } },
          },
        },
      }),
    );
  } catch (error) {
    // Not sent, so a retry may send it.
    await release(event);
    throw error;
  }
  console.info("Sent", event);
}

/**
 * Handles records in stream order. On a failure, the failed record and every
 * later one are retried, so Notifications keep their order.
 */
export async function handler(
  streamEvent: DynamoDBStreamEvent,
): Promise<DynamoDBBatchResponse> {
  for (const record of streamEvent.Records) {
    try {
      await handle(record);
    } catch (error) {
      console.error("Sending a Notification failed", {
        eventId: record.eventID,
        error,
      });
      const sequence = record.dynamodb?.SequenceNumber;
      if (!sequence) {
        throw error;
      }
      return { batchItemFailures: [{ itemIdentifier: sequence }] };
    }
  }
  return { batchItemFailures: [] };
}

async function handle(record: DynamoDBRecord) {
  const event = eventFrom(
    image(record.dynamodb?.OldImage),
    image(record.dynamodb?.NewImage),
  );
  if (event) {
    await notify(event);
  }
}
