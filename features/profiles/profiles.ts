import "server-only";
import { cache } from "react";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "@/lib/dynamodb";
import { getSignedInStudent, type SignedInStudent } from "@/features/auth/server-session";
import { parseBio } from "./profile-fields";

/**
 * The signed-in student a Profile operation acts for. Signed-out visitors have
 * no Viewer, so every operation that shows Profile content requires one.
 */
export type Viewer = { studentId: string };

/** A Profile as one Viewer may see it. */
export type ProfileView = {
  id: string;
  displayName: string;
  initials: string;
  /** Plain text with `\n` line breaks; empty when the student has none. */
  bio: string;
  /** Whether the Viewer owns this Profile and may edit it. */
  isOwner: boolean;
};

/** The outcome of an edit: saved, or rejected with an error per field. */
export type ProfileUpdate<Field extends string> =
  | { ok: true }
  | { ok: false; fieldErrors: Partial<Record<Field, string>> };

// Cognito user IDs (`sub`) are UUIDs.
const STUDENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Profiles this server instance has already created or found.
const knownProfiles = new Set<string>();

function tableName() {
  const name = process.env.PROFILES_TABLE_NAME;
  if (!name) throw new Error("PROFILES_TABLE_NAME is not set.");
  return name;
}

function profileKey(studentId: string) {
  return { pk: `STUDENT#${studentId}`, sk: "PROFILE" };
}

function firstLetter(name: string) {
  return Array.from(name)[0]?.toUpperCase() ?? "";
}

/** How a student's name is shown: "First L.", never the full last name. */
function shownName(givenName: string, familyName: string) {
  const initial = firstLetter(familyName);
  return {
    displayName: initial ? `${givenName} ${initial}.` : givenName,
    initials: `${firstLetter(givenName)}${initial}`,
  };
}

async function ensureProfile(student: SignedInStudent) {
  if (knownProfiles.has(student.id)) return;
  if (!student.givenName || !student.familyName) return;
  try {
    await db.send(new PutCommand({
      TableName: tableName(),
      Item: {
        ...profileKey(student.id),
        studentId: student.id,
        givenName: student.givenName,
        familyName: student.familyName,
        createdAt: new Date().toISOString(),
      },
      // The name is fixed at creation; later sign-ins never overwrite it.
      ConditionExpression: "attribute_not_exists(pk)",
    }));
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) throw error;
  }
  knownProfiles.add(student.id);
}

/**
 * The signed-in student for this request, or null when signed out. The first
 * time a student is seen, their Profile is created from the names in their token.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const student = await getSignedInStudent();
  if (!student) return null;
  await ensureProfile(student);
  return { studentId: student.id };
});

/** A Profile as seen by `viewer`, or null when no Profile has this ID. */
// Requiring a Viewer keeps Profiles from signed-out visitors. Fields that only
// some viewers may see are decided here from `viewer`.
export async function getProfile(viewer: Viewer, studentId: string): Promise<ProfileView | null> {
  if (!STUDENT_ID.test(studentId)) return null;
  const { Item: item } = await db.send(new GetCommand({
    TableName: tableName(),
    Key: profileKey(studentId),
    ProjectionExpression: "givenName, familyName, bio",
    // A Profile created earlier in this request must be visible.
    ConsistentRead: true,
  }));
  if (!item || typeof item.givenName !== "string" || typeof item.familyName !== "string") return null;
  return {
    id: studentId,
    ...shownName(item.givenName, item.familyName),
    bio: typeof item.bio === "string" ? item.bio : "",
    isOwner: viewer.studentId === studentId,
  };
}

/**
 * Replaces the Viewer's own bio. An empty bio removes it. The bio is checked
 * here, so no caller can store one that breaks the rules.
 */
export async function updateBio(viewer: Viewer, rawBio: string): Promise<ProfileUpdate<"bio">> {
  const parsed = parseBio(rawBio);
  if (!parsed.ok) return { ok: false, fieldErrors: { bio: parsed.error } };
  await db.send(new UpdateCommand({
    TableName: tableName(),
    Key: profileKey(viewer.studentId),
    ...(parsed.value
      ? { UpdateExpression: "SET bio = :bio", ExpressionAttributeValues: { ":bio": parsed.value } }
      : { UpdateExpression: "REMOVE bio" }),
    // Never create a Profile here: it would have no name.
    ConditionExpression: "attribute_exists(pk)",
  }));
  return { ok: true };
}
