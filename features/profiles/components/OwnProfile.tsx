"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveProfile, type ProfileFormState } from "../actions";
import { BIO_MAX_LENGTH, bioLength } from "../profile-fields";
import styles from "../profile.module.css";

type OwnProfileProps = {
  bio: string;
  /** The read-only Profile, shown outside edit mode. */
  children: React.ReactNode;
};

/**
 * The owner's view of their Profile: read-only until they choose Edit profile,
 * then a form for the fields they can change.
 */
export default function OwnProfile({ bio, children }: OwnProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  // Only move focus back after leaving edit mode, not on the first render.
  const returnFocus = useRef(false);

  useEffect(() => {
    if (!isEditing && returnFocus.current) {
      returnFocus.current = false;
      editButton.current?.focus();
    }
  }, [isEditing]);

  function leaveEditMode() {
    returnFocus.current = true;
    setIsEditing(false);
  }

  if (isEditing) return <ProfileForm bio={bio} onDone={leaveEditMode} />;

  return (
    <>
      <button
        ref={editButton}
        type="button"
        className={`${styles.button} ${styles.editButton}`}
        onClick={() => setIsEditing(true)}
      >
        Edit profile
      </button>
      {children}
    </>
  );
}

function ProfileForm({ bio: savedBio, onDone }: { bio: string; onDone: () => void }) {
  const [bio, setBio] = useState(savedBio);
  const [state, formAction, isSaving] = useActionState<ProfileFormState, FormData>(saveProfile, { status: "idle" });

  // Leave edit mode once the save has committed, together with the refreshed
  // Profile, so the old bio never flashes back.
  useEffect(() => {
    if (state.status === "saved") onDone();
  }, [state, onDone]);
  const bioError = state.status === "invalid" ? state.fieldErrors.bio : undefined;
  const length = bioLength(bio);

  return (
    <form action={formAction} className={styles.form} aria-label="Edit profile">
      <div className={styles.field}>
        <label htmlFor="profile-bio">Bio</label>
        <p id="profile-bio-hint" className={styles.hint}>
          Optional. Plain text; line breaks are kept.
        </p>
        <textarea
          id="profile-bio"
          name="bio"
          rows={8}
          value={bio}
          autoFocus
          aria-invalid={bioError ? true : undefined}
          aria-describedby={`profile-bio-hint profile-bio-count${bioError ? " profile-bio-error" : ""}`}
          onChange={(event) => setBio(event.target.value)}
        />
        <p
          id="profile-bio-count"
          className={length > BIO_MAX_LENGTH ? `${styles.count} ${styles.over}` : styles.count}
        >
          {length} / {BIO_MAX_LENGTH}
        </p>
        {bioError && <p id="profile-bio-error" role="alert" className={styles.fieldError}>{bioError}</p>}
      </div>
      {state.status === "failed" && <p role="alert" className={styles.fieldError}>{state.message}</p>}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button type="button" className={styles.button} disabled={isSaving} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
