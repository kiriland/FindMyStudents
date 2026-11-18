"use server";

import { sendRequest, withdrawRequest } from "./connections";
import { connectionRefusalMessage } from "./connection-model";
import { refresh } from "next/cache";
import { CONTACT_FIELDS } from "./profile-model";
import { addHelpOffer, confirmPictureUpload, getViewer, removeHelpOffer, removePicture, startPictureUpload, updateProfile, type Outcome, type PictureUploadOutcome, type ProfileEdit, type ProfileEditOutcome, type Viewer } from "./profiles";

/** What the edit-mode form shows: nothing yet (null), or how the last save went. */
export type ProfileFormState = ProfileEditOutcome | Outcome | null;

function failed(message: string) {
  return { ok: false, message } as const;
}

/** Re-renders the Profile in this response, so it shows the change, and reports it done. */
function done() {
  refresh();
  return { ok: true } as const;
}

/**
 * Runs `act` for the signed-in student. A signed-out caller gets a message to
 * log in again; if anything throws, the error is logged as `task` failing and
 * the student gets `failureMessage`.
 */
async function asSignedInStudent<Result>(
  task: string,
  failureMessage: string,
  act: (viewer: Viewer) => Promise<Result>,
): Promise<Result | ReturnType<typeof failed>> {
  // Inside the `try`, because finding the Viewer can create their Profile, and that can fail.
  let viewer: Viewer | null = null;
  try {
    viewer = await getViewer();
    if (!viewer) return failed("Your session has ended. Log in again to make changes.");
    return await act(viewer);
  } catch (error) {
    console.error(`${task} failed`, { studentId: viewer?.studentId, error });
    return failed(failureMessage);
  }
}

// Anyone can call a server action with any arguments, so each is read as text.
function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

/**
 * Saves the edit-mode form to the signed-in student's own Profile. The Profile
 * is always the Viewer's: the form never says whose Profile to change.
 */
export async function saveProfile(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const edit = {
    bio: text(formData.get("bio")),
    ...Object.fromEntries(CONTACT_FIELDS.map((field) => [field, text(formData.get(field))])),
  } as ProfileEdit;
  return asSignedInStudent("Saving a Profile", "Your profile could not be saved. Please try again.", async (viewer) => {
    const outcome = await updateProfile(viewer, edit);
    return outcome.ok ? done() : outcome;
  });
}

/** Adds a Help Offer for a Course to the signed-in student's own Profile. */
export async function offerHelp(courseCode: unknown): Promise<Outcome> {
  return asSignedInStudent("Adding a Help Offer", "That course could not be added. Please try again.", async (viewer) => {
    const outcome = await addHelpOffer(viewer, text(courseCode));
    return outcome.ok ? done() : outcome;
  });
}

/** Removes a Help Offer from the signed-in student's own Profile. */
export async function withdrawHelp(courseCode: unknown): Promise<Outcome> {
  return asSignedInStudent("Removing a Help Offer", "That course could not be removed. Please try again.", async (viewer) => {
    await removeHelpOffer(viewer, text(courseCode));
    return done();
  });
}

const PICTURE_FAILED = "Your picture could not be saved. Please try again.";

/** Lets the signed-in student upload a picture of `type` and `size` bytes, for `confirmPicture` to publish. */
export async function requestPictureUpload(type: unknown, size: unknown): Promise<PictureUploadOutcome> {
  // Nothing on the Profile changes yet, so there is nothing to refresh.
  return asSignedInStudent("Starting a picture upload", PICTURE_FAILED, (viewer) =>
    startPictureUpload(viewer, text(type), typeof size === "number" ? size : 0));
}

/** Publishes the signed-in student's uploaded picture on their own Profile. */
export async function confirmPicture(uploadId: unknown): Promise<Outcome> {
  return asSignedInStudent("Publishing a picture", PICTURE_FAILED, async (viewer) => {
    const outcome = await confirmPictureUpload(viewer, text(uploadId));
    return outcome.ok ? done() : outcome;
  });
}

/** Removes the signed-in student's picture from their own Profile. */
export async function deletePicture(): Promise<Outcome> {
  return asSignedInStudent("Removing a picture", "Your picture could not be removed. Please try again.", async (viewer) => {
    await removePicture(viewer);
    return done();
  });
}

export async function sendConnectionRequest(recipient: unknown, courseCode: unknown, message: unknown): Promise<Outcome> {
  return asSignedInStudent("Sending a Connection Request", "Your request could not be sent. Please try again.", async (viewer) => {
    const outcome = await sendRequest(viewer, text(recipient), text(courseCode), text(message));
    return outcome.ok ? done() : failed(connectionRefusalMessage(outcome));
  });
}

export async function withdrawConnectionRequest(otherId: unknown, requestId: unknown): Promise<Outcome> {
  return asSignedInStudent("Withdrawing a Connection Request", "Your request could not be withdrawn. Please try again.", async (viewer) => {
    const outcome = await withdrawRequest(viewer, text(otherId), text(requestId));
    return outcome.ok ? done() : failed(connectionRefusalMessage(outcome));
  });
}
