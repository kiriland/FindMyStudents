"use server";

import { refresh } from "next/cache";
import { MAX_HELP_OFFERS } from "./help-offers";
import { CONTACT_FIELDS } from "./profile-fields";
import { addHelpOffer, confirmPictureUpload, getViewer, removeHelpOffer, removePicture, startPictureUpload, updateProfile, type HelpOfferRefusal, type PictureRefusal, type PictureUpload, type ProfileEdit, type Viewer } from "./profiles";

/** An action that didn't happen, with a message to show the student. */
export type ActionFailure = { status: "failed"; message: string };

/** The outcome of changing the Profile: done, or a message to show. */
export type ChangeResult = { status: "done" } | ActionFailure;

export type ProfileFormState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<keyof ProfileEdit, string>> }
  | ChangeResult;

export type PictureUploadResult = { status: "ready"; upload: PictureUpload } | ActionFailure;

function failed(message: string): ActionFailure {
  return { status: "failed", message };
}

/** Re-renders the Profile in this response, so it shows the change, and reports it done. */
function changed(): ChangeResult {
  refresh();
  return { status: "done" };
}

/**
 * Runs `act` for the signed-in student. A signed-out caller gets a message to
 * log in again; if `act` throws, the error is logged as `task` failing and the
 * student gets `failureMessage`.
 */
async function asSignedInStudent<Result>(
  task: string,
  failureMessage: string,
  act: (viewer: Viewer) => Promise<Result>,
): Promise<Result | ActionFailure> {
  const viewer = await getViewer();
  if (!viewer) return failed("Your session has ended. Log in again to make changes.");
  try {
    return await act(viewer);
  } catch (error) {
    console.error(`${task} failed`, { studentId: viewer.studentId, error });
    return failed(failureMessage);
  }
}

function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Saves the edit-mode form to the signed-in student's own Profile. The Profile
 * is always the Viewer's: the form never says whose Profile to change.
 */
export async function saveProfile(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const edit = {
    bio: formText(formData, "bio"),
    ...Object.fromEntries(CONTACT_FIELDS.map((field) => [field, formText(formData, field)])),
  } as ProfileEdit;
  return asSignedInStudent("Saving a Profile", "Your profile could not be saved. Please try again.", async (viewer) => {
    const result = await updateProfile(viewer, edit);
    if (!result.ok) return { status: "invalid", fieldErrors: result.fieldErrors };
    return changed();
  });
}

const NO_PROFILE = "Your profile isn’t set up yet. Reload the page and try again.";

const HELP_OFFER_REFUSALS: Record<HelpOfferRefusal, string> = {
  limit: `You can offer help with up to ${MAX_HELP_OFFERS} courses. Remove one to add another.`,
  "unknown-course": "That course is no longer in the catalogue.",
  "no-profile": NO_PROFILE,
};

// Anyone can call a server action with any arguments.
function isCourseCode(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 40;
}

/** Adds a Help Offer for a Course to the signed-in student's own Profile. */
export async function offerHelp(courseCode: string): Promise<ChangeResult> {
  if (!isCourseCode(courseCode)) return failed(HELP_OFFER_REFUSALS["unknown-course"]);
  return asSignedInStudent("Adding a Help Offer", "That course could not be added. Please try again.", async (viewer) => {
    const result = await addHelpOffer(viewer, courseCode);
    if (!result.ok) return failed(HELP_OFFER_REFUSALS[result.reason]);
    return changed();
  });
}

/** Removes a Help Offer from the signed-in student's own Profile. */
export async function withdrawHelp(courseCode: string): Promise<ChangeResult> {
  // No such Course can be on the Profile, so there is nothing to remove.
  if (!isCourseCode(courseCode)) return { status: "done" };
  return asSignedInStudent("Removing a Help Offer", "That course could not be removed. Please try again.", async (viewer) => {
    await removeHelpOffer(viewer, courseCode);
    return changed();
  });
}

const PICTURE_FAILED = "Your picture could not be saved. Please try again.";

const PICTURE_REFUSALS: Record<Exclude<PictureRefusal["reason"], "invalid-file">, string> = {
  // The same for every block, so it never says which labels matched.
  blocked: "This picture can’t be used as a profile picture. Please choose another.",
  "missing-upload": "Your upload didn’t arrive. Please choose the picture again.",
  "no-profile": NO_PROFILE,
};

function pictureRefusal(refusal: PictureRefusal) {
  return failed(refusal.reason === "invalid-file" ? refusal.message : PICTURE_REFUSALS[refusal.reason]);
}

/** Lets the signed-in student upload a picture of `type` and `size` bytes, for `confirmPicture` to publish. */
export async function requestPictureUpload(type: unknown, size: unknown): Promise<PictureUploadResult> {
  return asSignedInStudent("Starting a picture upload", PICTURE_FAILED, async (viewer) => {
    const result = await startPictureUpload(viewer, typeof type === "string" ? type : "", typeof size === "number" ? size : 0);
    // Nothing on the Profile has changed yet, so there is nothing to refresh.
    return result.ok ? { status: "ready", upload: result.upload } : pictureRefusal(result.refusal);
  });
}

/** Publishes the signed-in student's uploaded picture on their own Profile. */
export async function confirmPicture(uploadId: unknown): Promise<ChangeResult> {
  return asSignedInStudent("Publishing a picture", PICTURE_FAILED, async (viewer) => {
    const result = await confirmPictureUpload(viewer, typeof uploadId === "string" ? uploadId : "");
    return result.ok ? changed() : pictureRefusal(result.refusal);
  });
}

/** Removes the signed-in student's picture from their own Profile. */
export async function deletePicture(): Promise<ChangeResult> {
  return asSignedInStudent("Removing a picture", "Your picture could not be removed. Please try again.", async (viewer) => {
    await removePicture(viewer);
    return changed();
  });
}
