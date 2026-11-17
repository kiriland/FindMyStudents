"use server";

import { refresh } from "next/cache";
import { MAX_HELP_OFFERS } from "./profile-fields";
import { addHelpOffer, confirmPictureUpload, getViewer, removeHelpOffer, removePicture, startPictureUpload, updateProfile, type PictureRefusal, type PictureUpload, type ProfileEdit } from "./profiles";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "invalid"; fieldErrors: Partial<Record<keyof ProfileEdit, string>> }
  | { status: "failed"; message: string };

/** The outcome of adding or removing a Help Offer: done, or a message to show. */
export type HelpOfferState = { ok: true } | { ok: false; message: string };

/** The outcome of a step of changing the picture: done, or a message to show. */
export type PictureState = { ok: true } | { ok: false; message: string };
export type PictureUploadState = { ok: true; upload: PictureUpload } | { ok: false; message: string };

const SESSION_ENDED = "Your session has ended. Log in again to make changes.";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Saves the edit-mode form to the signed-in student's own Profile. The Profile
 * is always the Viewer's: the form never says whose Profile to change.
 */
export async function saveProfile(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "failed", message: SESSION_ENDED };

  try {
    const result = await updateProfile(viewer, {
      bio: text(formData, "bio"),
      phone: text(formData, "phone"),
      discord: text(formData, "discord"),
      instagram: text(formData, "instagram"),
    });
    if (!result.ok) return { status: "invalid", fieldErrors: result.fieldErrors };
  } catch (error) {
    console.error("Saving a Profile failed", { studentId: viewer.studentId, error });
    return { status: "failed", message: "Your profile could not be saved. Please try again." };
  }
  // Re-render the Profile in this response, so it shows what was saved.
  refresh();
  return { status: "saved" };
}

// Anyone can call a server action with any arguments.
function isCourseCode(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 40;
}

const REFUSALS = {
  limit: `You can offer help with up to ${MAX_HELP_OFFERS} courses. Remove one to add another.`,
  "unknown-course": "That course is no longer in the catalogue.",
  "no-profile": "Your profile isn’t set up yet. Reload the page and try again.",
} as const;

/** Adds a Help Offer for a Course to the signed-in student's own Profile. */
export async function offerHelp(courseCode: string): Promise<HelpOfferState> {
  if (!isCourseCode(courseCode)) return { ok: false, message: REFUSALS["unknown-course"] };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  try {
    const result = await addHelpOffer(viewer, courseCode);
    if (!result.ok) return { ok: false, message: REFUSALS[result.reason] };
  } catch (error) {
    console.error("Adding a Help Offer failed", { studentId: viewer.studentId, error });
    return { ok: false, message: "That course could not be added. Please try again." };
  }
  refresh();
  return { ok: true };
}

/** Removes a Help Offer from the signed-in student's own Profile. */
export async function withdrawHelp(courseCode: string): Promise<HelpOfferState> {
  if (!isCourseCode(courseCode)) return { ok: true };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  try {
    await removeHelpOffer(viewer, courseCode);
  } catch (error) {
    console.error("Removing a Help Offer failed", { studentId: viewer.studentId, error });
    return { ok: false, message: "That course could not be removed. Please try again." };
  }
  refresh();
  return { ok: true };
}

const PICTURE_FAILED = "Your picture could not be saved. Please try again.";
// The same for every block, so it never says which labels matched.
const PICTURE_BLOCKED = "This picture can’t be used as a profile picture. Please choose another.";

function pictureRefusal(refusal: PictureRefusal) {
  if (refusal.reason === "invalid-file") return refusal.message;
  if (refusal.reason === "no-profile") return REFUSALS["no-profile"];
  if (refusal.reason === "blocked") return PICTURE_BLOCKED;
  return "Your upload didn’t arrive. Please choose the picture again.";
}

/** Lets the signed-in student upload a picture of `type` and `size` bytes, for `confirmPicture` to publish. */
export async function requestPictureUpload(type: unknown, size: unknown): Promise<PictureUploadState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  try {
    const result = await startPictureUpload(viewer, typeof type === "string" ? type : "", typeof size === "number" ? size : 0);
    if (!result.ok) return { ok: false, message: pictureRefusal(result.refusal) };
    return { ok: true, upload: result.upload };
  } catch (error) {
    console.error("Starting a picture upload failed", { studentId: viewer.studentId, error });
    return { ok: false, message: PICTURE_FAILED };
  }
}

/** Publishes the signed-in student's uploaded picture on their own Profile. */
export async function confirmPicture(uploadId: unknown): Promise<PictureState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  try {
    const result = await confirmPictureUpload(viewer, typeof uploadId === "string" ? uploadId : "");
    if (!result.ok) return { ok: false, message: pictureRefusal(result.refusal) };
  } catch (error) {
    console.error("Publishing a picture failed", { studentId: viewer.studentId, error });
    return { ok: false, message: PICTURE_FAILED };
  }
  refresh();
  return { ok: true };
}

/** Removes the signed-in student's picture from their own Profile. */
export async function deletePicture(): Promise<PictureState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: SESSION_ENDED };
  try {
    await removePicture(viewer);
  } catch (error) {
    console.error("Removing a picture failed", { studentId: viewer.studentId, error });
    return { ok: false, message: "Your picture could not be removed. Please try again." };
  }
  refresh();
  return { ok: true };
}
