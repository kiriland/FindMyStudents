import "server-only";
import { cache } from "react";
import { ConditionalCheckFailedException, TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import { BatchGetCommand, type BatchGetCommandOutput, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { db } from "@/lib/dynamodb";
import { getSignedInStudent, type SignedInStudent } from "@/features/auth/server-session";
import { getCourse } from "@/features/dashboard/course-catalogue";
import { courseCodeKey, courseHref, SCHOOL } from "@/features/dashboard/course-model";
import { profileHref } from "./profile-href";
import { CONTACT_FIELDS, MAX_HELP_OFFERS, parseBio, parseContact, type ContactField, type Contacts } from "./profile-fields";

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
  /** Oldest first, in the order the student added them. */
  helpOffers: HelpOfferView[];
  /** Only the owner gets contact details; for anyone else this is null. */
  contacts: Contacts | null;
};

/** A Help Offer as shown on a Profile: the Course it is for. */
export type HelpOfferView = { courseCode: string; title: string; href: string };

/** A Volunteer as a signed-in student sees them on a course page. */
export type VolunteerCard = {
  id: string;
  displayName: string;
  initials: string;
  /** The start of the bio on one line, at most BIO_EXCERPT_LENGTH characters plus "…". */
  bioExcerpt: string;
  href: string;
};

/**
 * A Course's Volunteers as one viewer may see them. Signed-out visitors get
 * only how many there are, never who they are.
 */
export type CourseVolunteers =
  | { visibility: "cards"; cards: VolunteerCard[] }
  | { visibility: "count"; count: number };

/** The fields of the edit-mode form. */
export type ProfileEdit = { bio: string } & Record<ContactField, string>;

/** Why a Help Offer could not be added. */
export type HelpOfferRefusal = "limit" | "unknown-course" | "no-profile";

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

const HELP_OFFER_PREFIX = "OFFER#";

function helpOfferKey(studentId: string, courseKey: string) {
  return { pk: `STUDENT#${studentId}`, sk: `${HELP_OFFER_PREFIX}${courseKey}` };
}

/** Groups a Course's Help Offers, for its Volunteers newest first. */
function courseVolunteersKey(courseKey: string) {
  return `COURSE#${SCHOOL.slug}#${courseKey}`;
}

/** The index of Help Offers by `courseVolunteersKey`, sorted by `createdAt`. */
const COURSE_VOLUNTEERS_INDEX = "course-volunteers";

const BIO_EXCERPT_LENGTH = 140;
// DynamoDB reads at most this many items in one BatchGetItem.
const BATCH_GET_LIMIT = 100;
const BATCH_GET_ATTEMPTS = 5;

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

/** What every viewer may see of a Profile item, or null when it has no name. */
function shownProfile(item: Record<string, unknown> | undefined) {
  if (!item || typeof item.givenName !== "string" || typeof item.familyName !== "string") return null;
  return { ...shownName(item.givenName, item.familyName), bio: typeof item.bio === "string" ? item.bio : "" };
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
// some viewers may see are decided here from `viewer`, and are never even read
// for anyone else.
export async function getProfile(viewer: Viewer, studentId: string): Promise<ProfileView | null> {
  if (!STUDENT_ID.test(studentId)) return null;
  const isOwner = viewer.studentId === studentId;
  const fields = ["sk", "givenName", "familyName", "bio", "courseCode", "courseTitle", "createdAt", ...(isOwner ? CONTACT_FIELDS : [])];
  // The Profile and its Help Offers share a partition, so one query reads them all.
  const { Items: items = [] } = await db.send(new QueryCommand({
    TableName: tableName(),
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": profileKey(studentId).pk },
    ProjectionExpression: fields.map((_, index) => `#f${index}`).join(", "),
    ExpressionAttributeNames: Object.fromEntries(fields.map((field, index) => [`#f${index}`, field])),
    // A Profile created, or a Help Offer added, earlier in this request must be visible.
    ConsistentRead: true,
  }));
  const item = items.find((candidate) => candidate.sk === "PROFILE");
  const shown = shownProfile(item);
  if (!item || !shown) return null;
  const helpOffers = items
    .filter((offer) => typeof offer.sk === "string" && offer.sk.startsWith(HELP_OFFER_PREFIX) && typeof offer.courseCode === "string")
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((offer) => ({
      courseCode: offer.courseCode,
      title: typeof offer.courseTitle === "string" && offer.courseTitle ? offer.courseTitle : offer.courseCode,
      href: courseHref({ courseCode: offer.courseCode }),
    }));
  return {
    id: studentId,
    ...shown,
    isOwner,
    helpOffers,
    contacts: isOwner
      ? Object.fromEntries(CONTACT_FIELDS.flatMap((field) => typeof item[field] === "string" && item[field] ? [[field, item[field]]] : []))
      : null,
  };
}

/**
 * Replaces the Viewer's own bio and contact details. An empty field removes
 * it. Every field is checked here, so no caller can store one that breaks the
 * rules, and nothing is saved unless all of them pass.
 */
export async function updateProfile(viewer: Viewer, edit: ProfileEdit): Promise<ProfileUpdate<keyof ProfileEdit>> {
  const values: Partial<Record<keyof ProfileEdit, string>> = {};
  const fieldErrors: Partial<Record<keyof ProfileEdit, string>> = {};
  const bio = parseBio(edit.bio);
  if (bio.ok) values.bio = bio.value;
  else fieldErrors.bio = bio.error;
  for (const field of CONTACT_FIELDS) {
    const parsed = parseContact(field, edit[field]);
    if (parsed.ok) values[field] = parsed.value;
    else fieldErrors[field] = parsed.error;
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const fields = Object.keys(values) as (keyof ProfileEdit)[];
  const set = fields.filter((field) => values[field]);
  const remove = fields.filter((field) => !values[field]);
  await db.send(new UpdateCommand({
    TableName: tableName(),
    Key: profileKey(viewer.studentId),
    UpdateExpression: [
      set.length ? `SET ${set.map((field) => `#${field} = :${field}`).join(", ")}` : "",
      remove.length ? `REMOVE ${remove.map((field) => `#${field}`).join(", ")}` : "",
    ].filter(Boolean).join(" "),
    ExpressionAttributeNames: Object.fromEntries(fields.map((field) => [`#${field}`, field])),
    ...(set.length ? { ExpressionAttributeValues: Object.fromEntries(set.map((field) => [`:${field}`, values[field]])) } : {}),
    // Never create a Profile here: it would have no name.
    ConditionExpression: "attribute_exists(pk)",
  }));
  return { ok: true };
}

function conditionFailed(error: unknown, index: number) {
  return error instanceof TransactionCanceledException && error.CancellationReasons?.[index]?.Code === "ConditionalCheckFailed";
}

/**
 * Offers the Viewer's help with a Course. Adding one the Viewer already has
 * does nothing. A Profile with a name is all that is needed, and a student has
 * at most MAX_HELP_OFFERS at a time.
 */
export async function addHelpOffer(viewer: Viewer, courseCode: string): Promise<{ ok: true } | { ok: false; reason: HelpOfferRefusal }> {
  const course = await getCourse(SCHOOL.slug, courseCode);
  if (!course) return { ok: false, reason: "unknown-course" };
  const courseKey = courseCodeKey(course.courseCode);
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableName(),
            Item: {
              ...helpOfferKey(viewer.studentId, courseKey),
              studentId: viewer.studentId,
              school: course.school,
              courseCode: course.courseCode,
              courseTitle: course.title,
              courseKey: courseVolunteersKey(courseKey),
              createdAt: new Date().toISOString(),
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          // The count on the Profile is what enforces the limit atomically.
          Update: {
            TableName: tableName(),
            Key: profileKey(viewer.studentId),
            UpdateExpression: "SET helpOfferCount = if_not_exists(helpOfferCount, :zero) + :one",
            ConditionExpression: "attribute_exists(pk) AND (attribute_not_exists(helpOfferCount) OR helpOfferCount < :max)",
            ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":max": MAX_HELP_OFFERS },
            ReturnValuesOnConditionCheckFailure: "ALL_OLD",
          },
        },
      ],
    }));
  } catch (error) {
    if (conditionFailed(error, 0)) return { ok: true };
    if (conditionFailed(error, 1)) {
      const profile = (error as TransactionCanceledException).CancellationReasons?.[1]?.Item;
      return { ok: false, reason: profile ? "limit" : "no-profile" };
    }
    throw error;
  }
  return { ok: true };
}

/** Withdraws the Viewer's Help Offer for a Course. Removing one they don't have does nothing. */
export async function removeHelpOffer(viewer: Viewer, courseCode: string): Promise<void> {
  const courseKey = courseCodeKey(courseCode);
  if (!courseKey) return;
  try {
    await db.send(new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: tableName(),
            Key: helpOfferKey(viewer.studentId, courseKey),
            ConditionExpression: "attribute_exists(pk)",
          },
        },
        {
          Update: {
            TableName: tableName(),
            Key: profileKey(viewer.studentId),
            UpdateExpression: "SET helpOfferCount = helpOfferCount - :one",
            ConditionExpression: "helpOfferCount > :zero",
            ExpressionAttributeValues: { ":zero": 0, ":one": 1 },
          },
        },
      ],
    }));
  } catch (error) {
    if (conditionFailed(error, 0)) return;
    throw error;
  }
}

/** Every page of a query, so a long list is never cut off at DynamoDB's 1 MB page. */
async function queryAll(input: QueryCommandInput) {
  const items: Record<string, unknown>[] = [];
  let count = 0;
  let startKey: QueryCommandInput["ExclusiveStartKey"];
  do {
    const page = await db.send(new QueryCommand({ ...input, ExclusiveStartKey: startKey }));
    items.push(...(page.Items ?? []));
    count += page.Count ?? 0;
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return { items, count };
}

/** The Profile items of these students, keyed by student ID. Missing Profiles are left out. */
async function getProfileItems(studentIds: string[]) {
  const profiles = new Map<string, Record<string, unknown>>();
  for (let start = 0; start < studentIds.length; start += BATCH_GET_LIMIT) {
    let keys: Record<string, unknown>[] | undefined = studentIds.slice(start, start + BATCH_GET_LIMIT).map(profileKey);
    for (let attempt = 0; keys?.length; attempt += 1) {
      if (attempt === BATCH_GET_ATTEMPTS) throw new Error("DynamoDB kept leaving Profiles unread.");
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** attempt));
      const result: BatchGetCommandOutput = await db.send(new BatchGetCommand({
        RequestItems: {
          [tableName()]: {
            Keys: keys,
            // Contact details are never read for a course page.
            ProjectionExpression: "studentId, givenName, familyName, bio",
          },
        },
      }));
      for (const item of result.Responses?.[tableName()] ?? []) {
        if (typeof item.studentId === "string") profiles.set(item.studentId, item);
      }
      keys = result.UnprocessedKeys?.[tableName()]?.Keys;
    }
  }
  return profiles;
}

/** The start of a bio on one line, cut at a word where one is near. */
function bioExcerpt(bio: string) {
  const oneLine = bio.replace(/\s+/g, " ").trim();
  const chars = Array.from(oneLine);
  if (chars.length <= BIO_EXCERPT_LENGTH) return oneLine;
  const cut = chars.slice(0, BIO_EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > BIO_EXCERPT_LENGTH * 0.7 ? cut.slice(0, lastSpace) : cut).join("").trimEnd()}…`;
}

/**
 * The Volunteers for a Course, newest Help Offer first, as `viewer` may see
 * them. A signed-out visitor (no Viewer) gets only the count: no names, bios
 * or pictures are read for them at all.
 */
export async function getCourseVolunteers(viewer: Viewer | null, courseCode: string): Promise<CourseVolunteers> {
  const courseKey = courseCodeKey(courseCode);
  if (!courseKey) return viewer ? { visibility: "cards", cards: [] } : { visibility: "count", count: 0 };
  const query: QueryCommandInput = {
    TableName: tableName(),
    IndexName: COURSE_VOLUNTEERS_INDEX,
    KeyConditionExpression: "courseKey = :courseKey",
    ExpressionAttributeValues: { ":courseKey": courseVolunteersKey(courseKey) },
  };
  if (!viewer) {
    const { count } = await queryAll({ ...query, Select: "COUNT" });
    return { visibility: "count", count };
  }
  const { items: offers } = await queryAll({ ...query, ProjectionExpression: "studentId", ScanIndexForward: false });
  // A student has one Help Offer per Course, so the IDs are already unique.
  const studentIds = offers.flatMap((offer) => typeof offer.studentId === "string" ? [offer.studentId] : []);
  const profiles = await getProfileItems(studentIds);
  const cards = studentIds.flatMap((studentId) => {
    const shown = shownProfile(profiles.get(studentId));
    if (!shown) return [];
    const { bio, ...name } = shown;
    return [{ id: studentId, ...name, bioExcerpt: bioExcerpt(bio), href: profileHref(studentId) }];
  });
  return { visibility: "cards", cards };
}
