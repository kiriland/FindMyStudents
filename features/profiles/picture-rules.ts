import type { FieldResult } from "./profile-fields";

/**
 * Rules for the profile picture a student uploads. Shared by the server, which
 * enforces them, and the picture editor, which checks a file before sending it.
 */

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
