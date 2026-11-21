import { codePoints } from "@/lib/text";

/**
 * The Profile rules shared by the server, which enforces them, and the
 * browser, which shows them as the student types. Nothing here is secret.
 */

export type FieldResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** The path of a student's Profile page. */
export function profileHref(studentId: string) {
  return `/students/${encodeURIComponent(studentId)}`;
}

/** What a student types, with their email, to confirm deleting their account. */
export const DELETE_ACCOUNT_PHRASE = "delete my account";

/** The most Help Offers one student may have at a time. */
export const MAX_HELP_OFFERS = 15;

// Bio

export const BIO_MAX_LENGTH = 1000;

/** A bio as it is stored: plain text with `\n` line breaks, no outer whitespace. */
export function normalizeBio(raw: string) {
  // Browsers submit textarea line breaks as CRLF.
  return raw.replaceAll(/\r\n?/g, "\n").trim();
}

/** Length in characters (code points), so an emoji counts once. */
export function bioLength(bio: string) {
  return codePoints(normalizeBio(bio)).length;
}

export function parseBio(raw: string): FieldResult<string> {
  const bio = normalizeBio(raw);
  if (codePoints(bio).length > BIO_MAX_LENGTH) {
    return {
      ok: false,
      error: `Keep your bio to ${String(BIO_MAX_LENGTH)} characters or fewer.`,
    };
  }
  return { ok: true, value: bio };
}

// Contact details

/** The contact details a student may add. Each is optional and visible only to the owner and their Connections. */
export const CONTACT_FIELDS = ["phone", "discord", "instagram"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type Contacts = Partial<Record<ContactField, string>>;

interface ContactRule {
  label: string;
  /** Shown under the field, and as its error when a value breaks the rule. */
  hint: string;
  /** The value as stored. */
  normalize: (raw: string) => string;
  isValid: (value: string) => boolean;
}

/** A handle as typed, without outer whitespace or one leading `@`. */
function withoutAt(raw: string) {
  return raw.trim().replace(/^@/, "");
}

export const CONTACT_RULES: Record<ContactField, ContactRule> = {
  phone: {
    label: "Phone",
    hint: "Use 7–15 digits. Only digits, +, spaces, - and ( ) are allowed.",
    normalize: (raw) => raw.trim().replaceAll(/\s+/g, " "),
    isValid: (phone) => {
      const digits = phone.replaceAll(/\D/g, "").length;
      return /^[0-9+ ()-]+$/.test(phone) && digits >= 7 && digits <= 15;
    },
  },
  discord: {
    label: "Discord username",
    hint: "Use 2–32 letters, numbers, periods or underscores.",
    // Discord usernames are lowercase, so "Maya.C" is the same user as "maya.c".
    normalize: (raw) => withoutAt(raw).toLowerCase(),
    isValid: (discord) => /^[a-z0-9._]{2,32}$/.test(discord),
  },
  instagram: {
    label: "Instagram handle",
    hint: "Use up to 30 letters, numbers, periods or underscores.",
    normalize: withoutAt,
    isValid: (instagram) => /^[A-Za-z0-9._]{1,30}$/.test(instagram),
  },
};

/** Checks one contact field. An empty value is valid and means "none". */
export function parseContact(
  field: ContactField,
  raw: string,
): FieldResult<string> {
  const rule = CONTACT_RULES[field];
  const value = rule.normalize(raw);
  return !value || rule.isValid(value)
    ? { ok: true, value }
    : { ok: false, error: rule.hint };
}

// Pictures

/** The largest profile picture a student may upload. */
export const PICTURE_MAX_BYTES = 5 * 1024 * 1024;

/** The picture formats a student may upload, as their MIME types. */
export const PICTURE_TYPES = ["image/jpeg", "image/png"] as const;
export type PictureType = (typeof PICTURE_TYPES)[number];

export const PICTURE_TYPE_ERROR =
  "Choose a JPEG or PNG image. Other formats, including WebP, aren’t supported.";
export const PICTURE_SIZE_ERROR = "Choose an image of 5 MB or smaller.";
export const PICTURE_CONTENT_ERROR =
  "That file isn’t a valid JPEG or PNG image. Choose another picture.";

/**
 * Checks a picture's declared type and size before it is uploaded. The server
 * checks the bytes themselves again once they arrive.
 */
export function checkPictureFile(
  type: string,
  size: number,
): FieldResult<PictureType> {
  if (!isPictureType(type)) {
    return { ok: false, error: PICTURE_TYPE_ERROR };
  }
  if (!Number.isSafeInteger(size) || size <= 0) {
    return { ok: false, error: PICTURE_CONTENT_ERROR };
  }
  if (size > PICTURE_MAX_BYTES) {
    return { ok: false, error: PICTURE_SIZE_ERROR };
  }
  return { ok: true, value: type };
}

function isPictureType(type: string): type is PictureType {
  return PICTURE_TYPES.some((pictureType) => pictureType === type);
}
