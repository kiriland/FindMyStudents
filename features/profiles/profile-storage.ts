import "server-only";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { BatchGetCommand, type BatchGetCommandOutput } from "@aws-sdk/lib-dynamodb";
import { db } from "@/lib/dynamodb";
import { CONTACT_FIELDS, type Contacts } from "./profile-model";
import { isPictureKey, pictureUrl } from "./pictures";

const BATCH_GET_ATTEMPTS = 5;

export function tableName() {
  const name = process.env.PROFILES_TABLE_NAME;
  if (!name) throw new Error("PROFILES_TABLE_NAME is not set.");
  return name;
}

export function profileKey(studentId: string) {
  return { pk: `STUDENT#${studentId}`, sk: "PROFILE" };
}

/** A conditional write whose condition failed (e.g. the item already exists) did nothing, which is fine. */
export function ignoreConditionFailure(error: unknown) {
  if (!(error instanceof ConditionalCheckFailedException)) throw error;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** A stored Profile item, checked once here so the rest of the module can trust it. */
export function readProfile(item: Record<string, unknown> | undefined) {
  if (!item) return null;
  const { studentId, givenName, familyName } = item;
  if (typeof studentId !== "string" || typeof givenName !== "string" || typeof familyName !== "string") return null;
  return {
    studentId,
    givenName,
    familyName,
    bio: text(item.bio),
    pictureKey: isPictureKey(item.pictureKey) ? item.pictureKey : null,
    contacts: Object.fromEntries(CONTACT_FIELDS.flatMap((field) => (text(item[field]) ? [[field, item[field]]] : []))) as Contacts,
  };
}

type ProfileRecord = NonNullable<ReturnType<typeof readProfile>>;

function firstLetter(name: string) {
  return Array.from(name)[0]?.toUpperCase() ?? "";
}

/**
 * What every signed-in viewer may see of a Profile. Signing a picture link is
 * the only way to see a picture, so this is never called for a signed-out visitor.
 */
export async function shownProfile({ givenName, familyName, bio, pictureKey }: ProfileRecord) {
  // "First L.", never the full last name.
  const initial = firstLetter(familyName);
  return {
    displayName: initial ? `${givenName} ${initial}.` : givenName,
    initials: `${firstLetter(givenName)}${initial}`,
    pictureUrl: pictureKey ? await pictureUrl(pictureKey) : null,
    bio,
  };
}

/** The Profiles of these students (at most 100), keyed by student ID. Missing Profiles are left out. */
export async function getProfiles(studentIds: string[]) {
  const profiles = new Map<string, ProfileRecord>();
  let keys: Record<string, unknown>[] | undefined = studentIds.map(profileKey);
  for (let attempt = 0; keys?.length; attempt += 1) {
    if (attempt === BATCH_GET_ATTEMPTS) throw new Error("DynamoDB kept leaving Profiles unread.");
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
    const result: BatchGetCommandOutput = await db.send(new BatchGetCommand({
      RequestItems: {
        // Contact details are never read for a course page.
        [tableName()]: { Keys: keys, ProjectionExpression: "studentId, givenName, familyName, bio, pictureKey" },
      },
    }));
    for (const item of result.Responses?.[tableName()] ?? []) {
      const profile = readProfile(item);
      if (profile) profiles.set(profile.studentId, profile);
    }
    keys = result.UnprocessedKeys?.[tableName()]?.Keys;
  }
  return profiles;
}
