/**
 * Rules for the Profile fields a student edits. Shared by the server, which
 * enforces them, and the edit form, which shows them as the student types.
 */

export const BIO_MAX_LENGTH = 1000;

/** A bio as it is stored: plain text with `\n` line breaks, no outer whitespace. */
export function normalizeBio(raw: string) {
  // Browsers submit textarea line breaks as CRLF.
  return raw.replace(/\r\n?/g, "\n").trim();
}

/** Length in characters (code points), so an emoji counts once. */
export function bioLength(bio: string) {
  return Array.from(normalizeBio(bio)).length;
}

export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseBio(raw: string): FieldResult<string> {
  const bio = normalizeBio(raw);
  if (Array.from(bio).length > BIO_MAX_LENGTH) {
    return { ok: false, error: `Keep your bio to ${BIO_MAX_LENGTH} characters or fewer.` };
  }
  return { ok: true, value: bio };
}

/** The contact details a student may add. Each is optional and owner-only for now. */
export type ContactField = "phone" | "discord" | "instagram";
export type Contacts = Partial<Record<ContactField, string>>;
export const CONTACT_FIELDS: readonly ContactField[] = ["phone", "discord", "instagram"];

/** A handle as typed, without outer whitespace or one leading `@`. */
function withoutAt(raw: string) {
  return raw.trim().replace(/^@/, "");
}

const contactRules: Record<ContactField, (raw: string) => FieldResult<string>> = {
  phone(raw) {
    const phone = raw.trim().replace(/\s+/g, " ");
    const digits = phone.replace(/\D/g, "").length;
    if (phone && (!/^[0-9+ ()-]+$/.test(phone) || digits < 7 || digits > 15)) {
      return { ok: false, error: "Enter a phone number of 7–15 digits, using only digits, +, spaces, - and ( )." };
    }
    return { ok: true, value: phone };
  },
  discord(raw) {
    // Discord usernames are lowercase, so "Maya.C" is the same user as "maya.c".
    const discord = withoutAt(raw).toLowerCase();
    if (discord && !/^[a-z0-9._]{2,32}$/.test(discord)) {
      return { ok: false, error: "Enter a Discord username of 2–32 letters, numbers, periods or underscores." };
    }
    return { ok: true, value: discord };
  },
  instagram(raw) {
    const instagram = withoutAt(raw);
    if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) {
      return { ok: false, error: "Enter an Instagram handle of up to 30 letters, numbers, periods or underscores." };
    }
    return { ok: true, value: instagram };
  },
};

/** Checks one contact field. An empty value is valid and means "none". */
export function parseContact(field: ContactField, raw: string): FieldResult<string> {
  return contactRules[field](raw);
}

/** A phone number as a `tel:` link target: only digits and a leading `+`. */
export function phoneHref(phone: string) {
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;
}

export function instagramHref(handle: string) {
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

/** The most Help Offers one student may have at a time. */
export const MAX_HELP_OFFERS = 15;

/** The largest profile picture a student may upload. */
export const PICTURE_MAX_BYTES = 5 * 1024 * 1024;

/** The picture formats a student may upload, as their MIME types. */
export const PICTURE_TYPES = ["image/jpeg", "image/png"] as const;
export type PictureType = (typeof PICTURE_TYPES)[number];

export function isPictureType(type: unknown): type is PictureType {
  return PICTURE_TYPES.includes(type as PictureType);
}

export const PICTURE_TYPE_ERROR = "Choose a JPEG or PNG image. Other formats, including WebP, aren’t supported.";
export const PICTURE_SIZE_ERROR = "Choose an image of 5 MB or smaller.";
export const PICTURE_CONTENT_ERROR = "That file isn’t a valid JPEG or PNG image. Choose another picture.";

/**
 * Checks a picture's declared type and size before it is uploaded. The server
 * checks the bytes themselves again once they arrive.
 */
export function checkPictureFile(type: string, size: number): FieldResult<PictureType> {
  if (!isPictureType(type)) return { ok: false, error: PICTURE_TYPE_ERROR };
  if (!Number.isSafeInteger(size) || size <= 0) return { ok: false, error: PICTURE_CONTENT_ERROR };
  if (size > PICTURE_MAX_BYTES) return { ok: false, error: PICTURE_SIZE_ERROR };
  return { ok: true, value: type };
}
