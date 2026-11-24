import "server-only";
import type { QueryCommandInput } from "@aws-sdk/lib-dynamodb";

import {
  ConditionalCheckFailedException,
  TransactionCanceledException,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  paginateQuery,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { cache } from "react";

import { getSignedInStudent } from "@/features/auth/server-session";
import { getCourse } from "@/features/courses/course-catalogue";
import {
  courseCodeKey,
  courseHref,
  SCHOOL,
} from "@/features/courses/course-model";
import { db } from "@/lib/dynamodb";
import { codePoints } from "@/lib/text";
import { isUuid } from "@/lib/uuid";

import type { QuarantinedUpload } from "./pictures";
import type { ContactField, Contacts } from "./profile-model";
import type { Outcome, Viewer } from "./profile-storage";

import { deleteRequestsAndConnections, isConnected } from "./connections";
import { moderatePicture } from "./moderation";
import {
  cleanPicture,
  createUpload,
  deletePictureObject,
  deleteStudentPictures,
  deleteUpload,
  isPictureKey,
  isUploadId,
  publishPicture,
  readUpload,
} from "./pictures";
import {
  checkPictureFile,
  CONTACT_FIELDS,
  DELETE_ACCOUNT_PHRASE,
  MAX_HELP_OFFERS,
  parseBio,
  parseContact,
  PICTURE_CONTENT_ERROR,
  profileHref,
} from "./profile-model";
import {
  backOff,
  batchGet,
  getProfiles,
  itemId,
  profileKey,
  readProfile,
  shownProfile,
  tableName,
  text,
} from "./profile-storage";

export type { Viewer, Outcome } from "./profile-storage";

/** A Profile as one Viewer may see it. Only its owner and their Connections get contact details. */
export type ProfileView = {
  id: string;
  displayName: string;
  initials: string;
  /** A short-lived link to the picture, or null to show the initials instead. */
  pictureUrl: string | null;
  /** Plain text with `\n` line breaks; empty when the student has none. */
  bio: string;
  /** Oldest first, in the order the student added them. */
  helpOffers: HelpOfferView[];
} & (
  | { isOwner: false; contacts: Contacts | null }
  | {
      isOwner: true;
      contacts: Contacts;
      /** Whether the owner gets Notifications. */
      emailNotifications: boolean;
    }
);

/** A Help Offer as shown on a Profile: the Course it is for. */
export interface HelpOfferView {
  courseCode: string;
  title: string;
  href: string;
}

/** A Volunteer as a signed-in student sees them on a course page. */
export interface VolunteerCard {
  id: string;
  displayName: string;
  initials: string;
  pictureUrl: string | null;
  /** The start of the bio on one line, at most BIO_EXCERPT_LENGTH characters plus "…". */
  bioExcerpt: string;
  href: string;
}

/**
 * A Course's Volunteers as one viewer may see them: how many there are and,
 * for a signed-in student only, the newest of them. Signed-out visitors get
 * null cards: they never learn who the Volunteers are.
 */
export interface CourseVolunteers {
  count: number;
  cards: VolunteerCard[] | null;
}

/** The fields of the edit-mode form. */
export type ProfileEdit = { bio: string } & Record<ContactField, string> & {
    emailNotifications: boolean;
  };
const EDIT_FIELDS = ["bio", ...CONTACT_FIELDS] as const;
type EditField = (typeof EDIT_FIELDS)[number];

export type ProfileEditOutcome = Outcome<{
  fieldErrors: Partial<Record<EditField, string>>;
}>;

/** Where and how the browser uploads a picture, then which upload to confirm. */
export interface PictureUpload {
  uploadId: string;
  url: string;
  fields: Record<string, string>;
}

export type PictureUploadOutcome =
  | { ok: true; upload: PictureUpload }
  | { ok: false; message: string };

// Profiles this server instance has already created or found.
const knownProfiles = new Set<string>();
const HELP_OFFER_PREFIX = "OFFER#";

/** A Help Offer's key. `normalizedCode` is a course code as `courseCodeKey` normalises it, e.g. "ACC2101". */
function helpOfferKey(studentId: string, normalizedCode: string) {
  return {
    pk: `STUDENT#${studentId}`,
    sk: `${HELP_OFFER_PREFIX}${normalizedCode}`,
  };
}

/**
 * The value a Help Offer stores in its `courseKey` attribute, which groups a
 * Course's Help Offers in the course-volunteers index.
 */
function courseVolunteersKey(normalizedCode: string) {
  return `COURSE#${SCHOOL.slug}#${normalizedCode}`;
}

/** The index of Help Offers by their `courseKey` attribute, sorted by `createdAt`. */
const COURSE_VOLUNTEERS_INDEX = "course-volunteers";
/** A course page shows at most this many Volunteers, newest first. Within BatchGetItem's 100 keys. */
const MAX_VOLUNTEER_CARDS = 50;
const BIO_EXCERPT_LENGTH = 140;

/**
 * Left in a deleted student's partition, so `getViewer` never creates their
 * Profile again, even if deleting their login failed or another tab loads a
 * page first. It holds nothing but the key.
 */
function deletedKey(studentId: string) {
  return { pk: profileKey(studentId).pk, sk: "DELETED" };
}

/** A stored Help Offer item, or null for any other item in the partition. */
function readHelpOffer(item: Record<string, unknown>) {
  if (
    !text(item.sk).startsWith(HELP_OFFER_PREFIX) ||
    typeof item.courseCode !== "string"
  ) {
    return null;
  }
  return {
    courseCode: item.courseCode,
    title: text(item.courseTitle) || item.courseCode,
    createdAt: text(item.createdAt),
  };
}

/**
 * The signed-in student for this request, or null when signed out. The first
 * time a student is seen, their Profile is created from the names in their token.
 */
/** The only place a Viewer is made: the brand stops other modules forging one. */
function viewerFor(studentId: string): Viewer {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the brand has no runtime value, so a cast is the only way to apply it.
  return { studentId } as Viewer;
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const student = await getSignedInStudent();
  if (!student) {
    return null;
  }
  if (!knownProfiles.has(student.id)) {
    // Cognito and the signup form both require the names, so a blank one means
    // the account was changed outside the app. Fail rather than hand out a
    // Viewer that has no Profile.
    if (!student.givenName || !student.familyName) {
      throw new Error(
        "A signed-in student has no name, so no Profile can be created.",
      );
    }
    if (!(await createProfile(student))) {
      return null;
    }
    knownProfiles.add(student.id);
  }
  return viewerFor(student.id);
});

/**
 * Creates the student's Profile unless they have one. False, with no Profile,
 * when they deleted their account.
 */
async function createProfile(student: {
  id: string;
  givenName: string;
  familyName: string;
}) {
  for (let attempt = 0; ; attempt++) {
    try {
      await db.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
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
              },
            },
            {
              ConditionCheck: {
                TableName: tableName(),
                Key: deletedKey(student.id),
                ConditionExpression: "attribute_not_exists(pk)",
              },
            },
          ],
        }),
      );
      return true;
    } catch (error) {
      const [profile, deleted] =
        error instanceof TransactionCanceledException
          ? (error.CancellationReasons ?? [])
          : [];
      if (deleted?.Code === "ConditionalCheckFailed") {
        return false;
      }
      if (profile?.Code === "ConditionalCheckFailed") {
        return true;
      }
      // Two first page loads at once: the other one may have created it.
      const conflict = [profile, deleted].some(
        (reason) => reason?.Code === "TransactionConflict",
      );
      if (!conflict || attempt === 3) {
        throw error;
      }
      await backOff(attempt);
    }
  }
}

/** Whether the signed-in student deleted their account, but their login is still signed in. */
export const isDeletedStudent = cache(async () => {
  const student = await getSignedInStudent();
  if (!student) {
    return false;
  }
  const key = deletedKey(student.id);
  return (await batchGet([key], [], { consistent: true })).has(itemId(key));
});

/** A Profile as seen by `viewer`, or null when no Profile has this ID. */
// Requiring a Viewer keeps Profiles from signed-out visitors. Fields that only
// some viewers may see are decided here from `viewer`, and are never even read
// for anyone else.
export async function getProfile(
  viewer: Viewer,
  studentId: string,
): Promise<ProfileView | null> {
  // Student IDs are Cognito user IDs (`sub`), which are UUIDs.
  if (!isUuid(studentId)) {
    return null;
  }
  const isOwner = viewer.studentId === studentId;
  const seesContacts = isOwner || (await isConnected(viewer, studentId));
  const fields = [
    "sk",
    "studentId",
    "givenName",
    "familyName",
    "bio",
    "pictureKey",
    "courseCode",
    "courseTitle",
    "createdAt",
    ...(seesContacts ? CONTACT_FIELDS : []),
    ...(isOwner ? ["emailNotifications"] : []),
  ];
  // The Profile and its Help Offers share a partition, so one query reads them all.
  const { Items: items = [] } = await db.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": profileKey(studentId).pk },
      ProjectionExpression: fields
        .map((_, index) => `#f${String(index)}`)
        .join(", "),
      ExpressionAttributeNames: Object.fromEntries(
        fields.map((field, index) => [`#f${String(index)}`, field]),
      ),
      // A Profile created, or a Help Offer added, earlier in this request must be visible.
      ConsistentRead: true,
    }),
  );
  const profile = readProfile(
    items.find((item) => item.sk === profileKey(studentId).sk),
  );
  if (!profile) {
    return null;
  }
  const helpOffers = items
    .flatMap((item) => readHelpOffer(item) ?? [])
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(({ courseCode, title }) => ({
      courseCode,
      title,
      href: courseHref({ courseCode }),
    }));
  const shown = { id: studentId, ...(await shownProfile(profile)), helpOffers };
  return isOwner
    ? {
        ...shown,
        isOwner,
        contacts: profile.contacts,
        emailNotifications: profile.emailNotifications,
      }
    : { ...shown, isOwner, contacts: seesContacts ? profile.contacts : null };
}

/**
 * Replaces the Viewer's own bio, contact details and Notifications setting.
 * An empty field removes it. Every field is checked here, so no caller can store one that breaks the
 * rules, and nothing is saved unless all of them pass.
 */
export async function updateProfile(
  viewer: Viewer,
  edit: ProfileEdit,
): Promise<ProfileEditOutcome> {
  const values: Partial<Record<EditField, string>> = {};
  const fieldErrors: Partial<Record<EditField, string>> = {};
  const bio = parseBio(edit.bio);
  if (bio.ok) {
    values.bio = bio.value;
  } else {
    fieldErrors.bio = bio.error;
  }
  for (const field of CONTACT_FIELDS) {
    const parsed = parseContact(field, edit[field]);
    if (parsed.ok) {
      values[field] = parsed.value;
    } else {
      fieldErrors[field] = parsed.error;
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const fields = EDIT_FIELDS.filter((field) => field in values);
  const set: string[] = [];
  const remove: string[] = [];
  const names: Record<string, string> = {};
  const attributeValues: Record<string, unknown> = {};
  for (const field of fields) {
    names[`#${field}`] = field;
    if (values[field]) {
      set.push(`#${field} = :${field}`);
      attributeValues[`:${field}`] = values[field];
    } else {
      remove.push(`#${field}`);
    }
  }
  // Stored only when turned off: a missing setting means on.
  names["#emailNotifications"] = "emailNotifications";
  if (edit.emailNotifications) {
    remove.push("#emailNotifications");
  } else {
    set.push("#emailNotifications = :emailNotifications");
    attributeValues[":emailNotifications"] = false;
  }
  await db.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: profileKey(viewer.studentId),
      UpdateExpression: [
        set.length > 0 ? `SET ${set.join(", ")}` : "",
        remove.length > 0 ? `REMOVE ${remove.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      ExpressionAttributeNames: names,
      ...(set.length > 0 ? { ExpressionAttributeValues: attributeValues } : {}),
      // An update never creates a Profile: it would have no name.
      ConditionExpression: "attribute_exists(pk)",
    }),
  );
  return { ok: true };
}

/**
 * Offers the Viewer's help with a Course. Adding one the Viewer already has
 * does nothing, and a student has at most MAX_HELP_OFFERS at a time.
 */
export async function addHelpOffer(
  viewer: Viewer,
  courseCode: string,
): Promise<Outcome> {
  const course = await getCourse(SCHOOL.slug, courseCode);
  if (!course) {
    return { ok: false, message: "That course is no longer in the catalogue." };
  }
  const { Count: offers = 0 } = await db.send(
    new QueryCommand({
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :offer)",
      ExpressionAttributeValues: {
        ":pk": profileKey(viewer.studentId).pk,
        ":offer": HELP_OFFER_PREFIX,
      },
      Select: "COUNT",
      ConsistentRead: true,
    }),
  );
  // Counted, not enforced atomically: two adds at the same moment could pass
  // the limit by one, which is fine for a limit that only stops abuse.
  if (offers >= MAX_HELP_OFFERS) {
    return {
      ok: false,
      message: `You can offer help with up to ${String(MAX_HELP_OFFERS)} courses. Remove one to add another.`,
    };
  }
  const normalizedCode = courseCodeKey(course.courseCode);
  try {
    await db.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName(),
              Item: {
                ...helpOfferKey(viewer.studentId, normalizedCode),
                studentId: viewer.studentId,
                courseCode: course.courseCode,
                courseTitle: course.title,
                courseKey: courseVolunteersKey(normalizedCode),
                createdAt: new Date().toISOString(),
              },
              // Keeps an existing offer, and its place in the newest-first order.
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          // Never into the partition of a student who is deleting their account.
          {
            ConditionCheck: {
              TableName: tableName(),
              Key: profileKey(viewer.studentId),
              ConditionExpression: "attribute_exists(pk)",
            },
          },
        ],
      }),
    );
  } catch (error) {
    const [offer, profile] =
      error instanceof TransactionCanceledException
        ? (error.CancellationReasons ?? [])
        : [];
    if (profile?.Code === "ConditionalCheckFailed") {
      return { ok: false, message: "This profile is no longer available." };
    }
    if (offer?.Code !== "ConditionalCheckFailed") {
      throw error;
    }
  }
  return { ok: true };
}

/** Withdraws the Viewer's Help Offer for a Course. Removing one they don't have does nothing. */
export async function removeHelpOffer(
  viewer: Viewer,
  courseCode: string,
): Promise<void> {
  const normalizedCode = courseCodeKey(courseCode);
  if (!normalizedCode) {
    return;
  }
  await db.send(
    new DeleteCommand({
      TableName: tableName(),
      Key: helpOfferKey(viewer.studentId, normalizedCode),
    }),
  );
}

/** The start of a bio on one line, cut at a word where one is near. */
function bioExcerpt(bio: string) {
  const oneLine = bio.replaceAll(/\s+/g, " ").trim();
  const chars = codePoints(oneLine);
  if (chars.length <= BIO_EXCERPT_LENGTH) {
    return oneLine;
  }
  const cut = chars.slice(0, BIO_EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > BIO_EXCERPT_LENGTH * 0.7 ? cut.slice(0, lastSpace) : cut).join("").trimEnd()}…`;
}

/** How many items a query matches, over every page, so a long list is never cut off at DynamoDB's 1 MB page. */
async function countItems(query: QueryCommandInput) {
  let count = 0;
  for await (const page of paginateQuery(
    { client: db },
    { ...query, Select: "COUNT" },
  )) {
    count += page.Count ?? 0;
  }
  return count;
}

/** Cards for the Volunteers behind a course's newest Help Offers. */
async function newestVolunteers(query: QueryCommandInput) {
  const { Items: offers = [] } = await db.send(
    new QueryCommand({
      ...query,
      ProjectionExpression: "studentId",
      ScanIndexForward: false,
      Limit: MAX_VOLUNTEER_CARDS,
    }),
  );
  // A student has one Help Offer per Course, so the IDs are already unique.
  const studentIds = offers.flatMap((offer) =>
    typeof offer.studentId === "string" ? [offer.studentId] : [],
  );
  const profiles = await getProfiles(studentIds);
  return Promise.all(
    studentIds.flatMap((studentId) => {
      const profile = profiles.get(studentId);
      if (!profile) {
        return [];
      }
      return shownProfile(profile).then(({ bio, ...name }): VolunteerCard => ({
        id: studentId,
        ...name,
        bioExcerpt: bioExcerpt(bio),
        href: profileHref(studentId),
      }));
    }),
  );
}

/**
 * The Volunteers for a Course as `viewer` may see them. A signed-out visitor
 * (no Viewer) gets only the count: no names, bios or pictures are read for
 * them at all.
 */
export async function getCourseVolunteers(
  viewer: Viewer | null,
  courseCode: string,
): Promise<CourseVolunteers> {
  const normalizedCode = courseCodeKey(courseCode);
  if (!normalizedCode) {
    return { count: 0, cards: viewer ? [] : null };
  }
  const query: QueryCommandInput = {
    TableName: tableName(),
    IndexName: COURSE_VOLUNTEERS_INDEX,
    KeyConditionExpression: "courseKey = :courseKey",
    ExpressionAttributeValues: {
      ":courseKey": courseVolunteersKey(normalizedCode),
    },
  };
  const [count, cards] = await Promise.all([
    countItems(query),
    viewer ? newestVolunteers(query) : null,
  ]);
  return { count, cards };
}

/**
 * Lets the Viewer upload a picture of `type` and `size` bytes into
 * quarantine. Nobody sees it until `confirmPictureUpload` has cleaned it.
 */
export async function startPictureUpload(
  viewer: Viewer,
  type: string,
  size: number,
): Promise<PictureUploadOutcome> {
  const file = checkPictureFile(type, size);
  if (!file.ok) {
    return { ok: false, message: file.error };
  }
  return { ok: true, upload: await createUpload(viewer.studentId, file.value) };
}

const UPLOAD_MISSING =
  "Your upload didn’t arrive. Please choose the picture again.";

/**
 * Checks the Viewer's upload is a real JPEG or PNG, strips its metadata,
 * moderates it and publishes it as their picture, replacing any previous one.
 * The upload is deleted whatever the outcome, and a refused upload leaves the
 * current picture in place.
 */
export async function confirmPictureUpload(
  viewer: Viewer,
  uploadId: string,
): Promise<Outcome> {
  if (!isUploadId(uploadId)) {
    return { ok: false, message: UPLOAD_MISSING };
  }
  const upload: QuarantinedUpload = { studentId: viewer.studentId, uploadId };
  const bytes = await readUpload(upload);
  if (!bytes) {
    return { ok: false, message: UPLOAD_MISSING };
  }
  try {
    const picture = await cleanPicture(bytes);
    if (!picture) {
      return { ok: false, message: PICTURE_CONTENT_ERROR };
    }
    const moderation = await moderatePicture(picture.bytes);
    if (!moderation.allowed) {
      // Only the label names, for tuning moderation: never the picture itself.
      console.warn("A picture was blocked by moderation", {
        studentId: viewer.studentId,
        labels: moderation.labels,
      });
      // The same for every block, so it never says which labels matched.
      return {
        ok: false,
        message:
          "This picture can’t be used as a profile picture. Please choose another.",
      };
    }
    // A new key every time, so a second confirmation of the same upload can
    // never publish over a picture that the Profile points at.
    const key = await publishPicture(viewer.studentId, picture);
    const { Attributes } = await db
      .send(
        new UpdateCommand({
          TableName: tableName(),
          Key: profileKey(viewer.studentId),
          UpdateExpression: "SET pictureKey = :key",
          ConditionExpression: "attribute_exists(pk)",
          ExpressionAttributeValues: { ":key": key },
          ReturnValues: "UPDATED_OLD",
        }),
      )
      .catch(async (error: unknown) => {
        // Only a failed condition proves the Profile doesn't point at the new
        // picture. Any other error may follow a committed update, so the picture
        // is kept: at worst an orphan, never a Profile pointing at nothing.
        if (error instanceof ConditionalCheckFailedException) {
          await deletePictureObject(key);
        }
        throw error;
      });
    // No history: the picture it replaced is gone for good.
    if (isPictureKey(Attributes?.pictureKey)) {
      await deleteOldPicture(viewer, Attributes.pictureKey);
    }
    return { ok: true };
  } finally {
    // The lifecycle rule removes it within a day if this fails.
    await deleteUpload(upload).catch((error: unknown) => {
      console.error("Deleting a quarantined upload failed", {
        studentId: viewer.studentId,
        uploadId,
        error,
      });
    });
  }
}

/** Removes the Viewer's picture, so their initials are shown again. Removing none does nothing. */
export async function removePicture(viewer: Viewer): Promise<void> {
  const { Attributes } = await db.send(
    new UpdateCommand({
      TableName: tableName(),
      Key: profileKey(viewer.studentId),
      UpdateExpression: "REMOVE pictureKey",
      // An update never creates a Profile: it would have no name.
      ConditionExpression: "attribute_exists(pk)",
      ReturnValues: "UPDATED_OLD",
    }),
  );
  if (isPictureKey(Attributes?.pictureKey)) {
    await deleteOldPicture(viewer, Attributes.pictureKey);
  }
}

// The Profile no longer points at the picture, so it can't be shown again. If
// deleting it fails, it is only an orphan in a private bucket.
async function deleteOldPicture(viewer: Viewer, key: string) {
  try {
    await deletePictureObject(key);
  } catch (error) {
    console.error("Deleting a replaced picture failed", {
      studentId: viewer.studentId,
      key,
      error,
    });
  }
}

/** Whether the Viewer has added any contact details, so the request form can suggest adding some. */
export async function hasContactDetails(viewer: Viewer) {
  const key = profileKey(viewer.studentId);
  const item = (
    await batchGet([key], [...CONTACT_FIELDS], { consistent: true })
  ).get(itemId(key));
  return CONTACT_FIELDS.some((field) => text(item?.[field]));
}

/**
 * The server's part of account deletion: deletes the signed-in student's
 * Profile, Help Offers, pictures, Connection Requests and Connections, once
 * they have typed their account email and DELETE_ACCOUNT_PHRASE, and keeps the
 * Profile from being created again. The browser then deletes their login (the
 * Cognito user), so a failure part way never leaves data that its owner can no
 * longer delete. Safe to repeat, which finishes a deletion that failed part way.
 */
// Takes no Viewer: a student part way through deletion no longer has one.
export async function deleteProfileData(
  email: string,
  phrase: string,
): Promise<Outcome> {
  const student = await getSignedInStudent();
  if (!student) {
    return {
      ok: false,
      message: "Your session has ended. Log in again to delete your account.",
    };
  }
  const viewer = viewerFor(student.id);
  if (
    student.email === "" ||
    email.trim().toLowerCase() !== student.email.toLowerCase() ||
    phrase.trim().toLowerCase() !== DELETE_ACCOUNT_PHRASE
  ) {
    return {
      ok: false,
      message: `Type your email and “${DELETE_ACCOUNT_PHRASE}” to confirm.`,
    };
  }
  // The Profile goes first: requests to or from a student without one are
  // refused, so none can be added while the rest is deleted.
  await db.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: { TableName: tableName(), Key: profileKey(viewer.studentId) },
        },
        { Put: { TableName: tableName(), Item: deletedKey(viewer.studentId) } },
      ],
    }),
  );
  knownProfiles.delete(viewer.studentId);
  await deleteRequestsAndConnections(viewer);
  const keys: Record<string, unknown>[] = [];
  for await (const page of paginateQuery(
    { client: db },
    {
      TableName: tableName(),
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": profileKey(viewer.studentId).pk },
      ProjectionExpression: "pk, sk",
      ConsistentRead: true,
    },
  )) {
    keys.push(
      ...(page.Items ?? []).filter(
        (key) => key.sk !== deletedKey(viewer.studentId).sk,
      ),
    );
  }
  // Help Offers, which also takes them off course pages.
  await Promise.all(
    keys.map(async (key) =>
      db.send(new DeleteCommand({ TableName: tableName(), Key: key })),
    ),
  );
  await deleteStudentPictures(viewer.studentId);
  return { ok: true };
}
