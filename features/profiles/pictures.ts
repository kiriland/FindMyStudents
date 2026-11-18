import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { s3 } from "@/lib/s3";
import { isUuid } from "@/lib/uuid";
import { PICTURE_MAX_BYTES, type PictureType } from "./profile-model";

/**
 * Profile picture storage, used only by the Profiles module. Uploads land in
 * `quarantine/`, which a lifecycle rule empties after a day; only cleaned
 * pictures are published under `pictures/`.
 */

const QUARANTINE_PREFIX = "quarantine/";
const PICTURE_PREFIX = "pictures/";

/** How long a browser has to start its upload. */
const UPLOAD_WINDOW_SECONDS = 5 * 60;
/** Picture links are signed for one window at a time, so they stay cacheable within it. */
const LINK_WINDOW_MS = 5 * 60 * 1000;
/** A link issued late in its window still works for this long. */
const LINK_LIFETIME_SECONDS = 15 * 60;
const LINK_CACHE_SECONDS = 10 * 60;
/** Larger pictures are scaled down; they are only ever shown small. */
const PICTURE_MAX_SIDE = 1024;
/** Refuses images that would take too long, or too much memory, to decode. */
const MAX_INPUT_PIXELS = 50_000_000;

const SIGNATURES: Record<PictureType, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};
const SHARP_FORMATS: Record<PictureType, string> = { "image/jpeg": "jpeg", "image/png": "png" };

function bucketName() {
  const name = process.env.PROFILE_PICTURES_BUCKET_NAME;
  if (!name) throw new Error("PROFILE_PICTURES_BUCKET_NAME is not set.");
  return name;
}

/** One student's upload waiting in quarantine to be cleaned and published. */
export type QuarantinedUpload = { studentId: string; uploadId: string };

function quarantineKey({ studentId, uploadId }: QuarantinedUpload) {
  return `${QUARANTINE_PREFIX}${studentId}/${uploadId}`;
}

/** Upload IDs come from `randomUUID()`, so anything else was never issued. */
export const isUploadId = isUuid;

export function isPictureKey(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PICTURE_PREFIX);
}

/** A presigned POST that lets the browser put one picture of `type` into quarantine. */
export async function createUpload(studentId: string, type: PictureType) {
  const uploadId = randomUUID();
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: bucketName(),
    Key: quarantineKey({ studentId, uploadId }),
    Fields: { "Content-Type": type },
    Conditions: [
      ["content-length-range", 1, PICTURE_MAX_BYTES],
      ["eq", "$Content-Type", type],
    ],
    Expires: UPLOAD_WINDOW_SECONDS,
  });
  return { uploadId, url, fields };
}

/** The bytes of an upload, or null when there is none or it is too large. */
export async function readUpload(upload: QuarantinedUpload) {
  try {
    const object = await s3.send(new GetObjectCommand({ Bucket: bucketName(), Key: quarantineKey(upload) }));
    if (!object.Body || (object.ContentLength ?? Infinity) > PICTURE_MAX_BYTES) {
      object.Body?.transformToWebStream().cancel().catch(() => {});
      return null;
    }
    return await object.Body.transformToByteArray();
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    throw error;
  }
}

export async function deleteUpload(upload: QuarantinedUpload) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucketName(), Key: quarantineKey(upload) }));
}

/** The real type of a picture, from its first bytes rather than what the browser claimed. */
function sniffType(bytes: Uint8Array): PictureType | null {
  for (const [type, signature] of Object.entries(SIGNATURES) as [PictureType, number[]][]) {
    if (signature.every((byte, index) => bytes[index] === byte)) return type;
  }
  return null;
}

export type CleanPicture = { type: PictureType; bytes: Buffer };

/**
 * A picture re-encoded in its own format with all metadata (EXIF, GPS, XMP,
 * ICC, comments) removed, or null when it isn't really a JPEG or PNG.
 */
export async function cleanPicture(bytes: Uint8Array): Promise<CleanPicture | null> {
  const type = sniffType(bytes);
  if (!type) return null;
  try {
    const image = sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
    const { format } = await image.metadata();
    if (format !== SHARP_FORMATS[type]) return null;
    // sharp writes no metadata unless asked to. Turning the pixels upright
    // first keeps the picture the right way up without its EXIF orientation.
    const pipeline = image
      .autoOrient()
      .resize({ width: PICTURE_MAX_SIDE, height: PICTURE_MAX_SIDE, fit: "inside", withoutEnlargement: true });
    const output = type === "image/jpeg"
      ? pipeline.jpeg({ quality: 85, mozjpeg: true })
      : pipeline.png({ compressionLevel: 9 });
    return { type, bytes: await output.toBuffer() };
  } catch {
    // Truncated, corrupt or oversized images are refused, not stored.
    return null;
  }
}

/**
 * Publishes a student's cleaned picture under a key never used before, and
 * returns that key. New keys also mean old links never show a new picture.
 */
export async function publishPicture(studentId: string, picture: CleanPicture) {
  const key = `${PICTURE_PREFIX}${studentId}/${randomUUID()}`;
  await s3.send(new PutObjectCommand({
    Bucket: bucketName(),
    Key: key,
    Body: picture.bytes,
    ContentType: picture.type,
    CacheControl: `private, max-age=${LINK_CACHE_SECONDS}`,
  }));
  return key;
}

export async function deletePictureObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
}

/**
 * A short-lived link to a published picture. Only call this for a signed-in
 * Viewer: the bucket is private, and this link is the only way in.
 */
export async function pictureUrl(key: string) {
  const windowStart = Math.floor(Date.now() / LINK_WINDOW_MS) * LINK_WINDOW_MS;
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: bucketName(),
    Key: key,
    ResponseCacheControl: `private, max-age=${LINK_CACHE_SECONDS}`,
  }), { expiresIn: LINK_LIFETIME_SECONDS, signingDate: new Date(windowStart) });
}
