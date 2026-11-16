"use server";

import { refresh } from "next/cache";
import { getViewer, updateBio } from "./profiles";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "invalid"; fieldErrors: { bio?: string } }
  | { status: "failed"; message: string };

/**
 * Saves the edit-mode form to the signed-in student's own Profile. The Profile
 * is always the Viewer's: the form never says whose Profile to change.
 */
export async function saveProfile(_previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "failed", message: "Your session has ended. Log in again to save." };

  const bio = formData.get("bio");
  try {
    const result = await updateBio(viewer, typeof bio === "string" ? bio : "");
    if (!result.ok) return { status: "invalid", fieldErrors: result.fieldErrors };
  } catch (error) {
    console.error("Saving a Profile failed", { studentId: viewer.studentId, error });
    return { status: "failed", message: "Your profile could not be saved. Please try again." };
  }
  // Re-render the Profile in this response, so it shows the saved bio.
  refresh();
  return { status: "saved" };
}
