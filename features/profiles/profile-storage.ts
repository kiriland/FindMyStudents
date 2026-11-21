import "server-only";
import type { BatchGetCommandOutput } from "@aws-sdk/lib-dynamodb";

import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";

import { db } from "@/lib/dynamodb";
import { codePoints } from "@/lib/text";

import type { Contacts } from "./profile-model";

import { isPictureKey, pictureUrl } from "./pictures";
import { CONTACT_FIELDS } from "./profile-model";

declare const viewerBrand: unique symbol;

/**
 * The signed-in student a Profile operation acts for. Only `getViewer` makes
 * one, and a Viewer always has a Profile. Signed-out visitors have no Viewer,
 * so every operation that shows Profile content requires one.
 */
export interface Viewer {
  readonly studentId: string;
  readonly [viewerBrand]: true;
}

/** The outcome of a change: done, or refused with a message to show the student. */
export type Outcome<Refusal = { message: string }> =
  | { ok: true }
  | ({ ok: false } & Refusal);

const BATCH_GET_ATTEMPTS = 5;

export function tableName() {
  const name = process.env.PROFILES_TABLE_NAME;
  if (!name) {
    throw new Error("PROFILES_TABLE_NAME is not set.");
  }
  return name;
}

export function profileKey(studentId: string) {
  return { pk: `STUDENT#${studentId}`, sk: "PROFILE" };
}

/** A conditional write whose condition failed (e.g. the item already exists) did nothing, which is fine. */
export function ignoreConditionFailure(error: unknown) {
  if (!(error instanceof ConditionalCheckFailedException)) {
    throw error;
  }
}

export function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** A stored Profile item, checked once here so the rest of the module can trust it. */
export function readProfile(item: Record<string, unknown> | undefined) {
  if (!item) {
    return null;
  }
  const { studentId, givenName, familyName } = item;
  if (
    typeof studentId !== "string" ||
    typeof givenName !== "string" ||
    typeof familyName !== "string"
  ) {
    return null;
  }
  return {
    studentId,
    givenName,
    familyName,
    bio: text(item.bio),
    pictureKey: isPictureKey(item.pictureKey) ? item.pictureKey : null,
    contacts: Object.fromEntries(
      CONTACT_FIELDS.flatMap((field) =>
        text(item[field]) ? [[field, item[field]]] : [],
      ),
    ) as Contacts,
  };
}

type ProfileRecord = NonNullable<ReturnType<typeof readProfile>>;

function firstLetter(name: string) {
  return codePoints(name)[0]?.toUpperCase() ?? "";
}

/**
 * What every signed-in viewer may see of a Profile. Signing a picture link is
 * the only way to see a picture, so this is never called for a signed-out visitor.
 */
export async function shownProfile({
  givenName,
  familyName,
  bio,
  pictureKey,
}: ProfileRecord) {
  // "First L.", never the full last name.
  const initial = firstLetter(familyName);
  return {
    displayName: initial ? `${givenName} ${initial}.` : givenName,
    initials: `${firstLetter(givenName)}${initial}`,
    pictureUrl: pictureKey ? await pictureUrl(pictureKey) : null,
    bio,
  };
}

export interface ItemKey {
  pk: string;
  sk: string;
}
export type StoredItem = Record<string, unknown>;

/** Where an item is stored, as one string, for looking items up by key. */
export function itemId(key: ItemKey) {
  return `${key.pk}/${key.sk}`;
}

/** Waits a little longer before each retry. */
export async function backOff(attempt: number) {
  return new Promise((resolve) => setTimeout(resolve, 25 * 2 ** attempt));
}

/**
 * Reads these items' `fields` in batches of 100, retrying the keys DynamoDB
 * leaves unprocessed. Keyed by `itemId`; missing items are left out.
 */
export async function batchGet(
  keys: ItemKey[],
  fields: string[],
  { consistent = false } = {},
) {
  const items = new Map<string, StoredItem>();
  const unique = [...new Map(keys.map((key) => [itemId(key), key])).values()];
  const table = tableName();
  const names = ["pk", "sk", ...fields];
  for (let offset = 0; offset < unique.length; offset += 100) {
    let remaining: StoredItem[] = unique
      .slice(offset, offset + 100)
      .map((key) => ({ ...key }));
    for (let attempt = 0; remaining.length > 0; attempt++) {
      if (attempt === BATCH_GET_ATTEMPTS) {
        throw new Error("DynamoDB kept leaving items unread.");
      }
      if (attempt) {
        await backOff(attempt);
      }
      const result: BatchGetCommandOutput = await db.send(
        new BatchGetCommand({
          RequestItems: {
            [table]: {
              Keys: remaining,
              ConsistentRead: consistent,
              ProjectionExpression: names
                .map((_, i) => `#f${String(i)}`)
                .join(", "),
              ExpressionAttributeNames: Object.fromEntries(
                names.map((field, i) => [`#f${String(i)}`, field]),
              ),
            },
          },
        }),
      );
      for (const item of result.Responses?.[table] ?? []) {
        if (typeof item.pk !== "string" || typeof item.sk !== "string") {
          throw new Error("Stored item has no key.");
        }
        items.set(itemId({ pk: item.pk, sk: item.sk }), item);
      }
      remaining = result.UnprocessedKeys?.[table]?.Keys ?? [];
    }
  }
  return items;
}

/** The Profiles of these students, keyed by student ID. Missing Profiles are left out. */
export async function getProfiles(studentIds: string[]) {
  const profiles = new Map<string, ProfileRecord>();
  // Contact details are never read here.
  const items = await batchGet(studentIds.map(profileKey), [
    "studentId",
    "givenName",
    "familyName",
    "bio",
    "pictureKey",
  ]);
  for (const item of items.values()) {
    const profile = readProfile(item);
    if (profile) {
      profiles.set(profile.studentId, profile);
    }
  }
  return profiles;
}
