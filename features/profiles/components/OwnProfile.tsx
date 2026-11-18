"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveProfile, type ProfileFormState } from "../actions";
import PictureEditor from "./PictureEditor";
import { BIO_MAX_LENGTH, bioLength, CONTACT_FIELDS, CONTACT_RULES, type ContactField, type Contacts } from "../profile-model";
import styles from "../profile.module.css";

type OwnProfileProps = {
  bio: string;
  hasPicture: boolean;
  contacts: Contacts;
  /** The read-only Profile, shown outside edit mode. */
  children: React.ReactNode;
};

/**
 * The owner's view of their Profile: read-only until they choose Edit profile,
 * then a form for the fields they can change.
 */
export default function OwnProfile({ bio, hasPicture, contacts, children }: OwnProfileProps) {
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

  if (isEditing) {
    return (
      <>
        {/* Outside the form: a picture saves as soon as it is chosen, not with Save. */}
        <PictureEditor hasPicture={hasPicture} />
        <ProfileForm bio={bio} contacts={contacts} onDone={leaveEditMode} />
      </>
    );
  }

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

// How each contact field is typed. Its label and rules come from the model.
const CONTACT_INPUTS: Record<ContactField, { type: string; autoComplete: string; placeholder: string }> = {
  phone: { type: "tel", autoComplete: "tel", placeholder: "+1 (212) 555-0123" },
  discord: { type: "text", autoComplete: "off", placeholder: "username" },
  instagram: { type: "text", autoComplete: "off", placeholder: "handle" },
};

type FormProps = { bio: string; contacts: Contacts; onDone: () => void };

function ProfileForm({ bio: savedBio, contacts, onDone }: FormProps) {
  const [bio, setBio] = useState(savedBio);
  // Controlled, so a rejected save keeps what the student typed.
  const [contactValues, setContactValues] = useState(
    () => Object.fromEntries(CONTACT_FIELDS.map((field) => [field, contacts[field] ?? ""])) as Record<ContactField, string>,
  );
  const [state, formAction, isSaving] = useActionState<ProfileFormState, FormData>(saveProfile, null);

  // Leave edit mode once the save has committed, together with the refreshed
  // Profile, so the old values never flash back.
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  const fieldErrors = state && "fieldErrors" in state ? state.fieldErrors : {};
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
          aria-invalid={fieldErrors.bio ? true : undefined}
          aria-describedby={`profile-bio-hint profile-bio-count${fieldErrors.bio ? " profile-bio-error" : ""}`}
          onChange={(event) => setBio(event.target.value)}
        />
        <p
          id="profile-bio-count"
          className={length > BIO_MAX_LENGTH ? `${styles.count} ${styles.over}` : styles.count}
        >
          {length} / {BIO_MAX_LENGTH}
        </p>
        {fieldErrors.bio && <p id="profile-bio-error" role="alert" className={styles.fieldError}>{fieldErrors.bio}</p>}
      </div>

      <fieldset className={styles.contactFields}>
        <legend>Contact details</legend>
        <p className={styles.hint}>
          Optional. <span className={styles.private}>Only visible to you and your Connections</span>
        </p>
        {CONTACT_FIELDS.map((field) => {
          const { label, hint } = CONTACT_RULES[field];
          // A rejected value shows the rule it broke as an error, in place of the hint.
          const error = fieldErrors[field];
          return (
            <div key={field} className={styles.field}>
              <label htmlFor={`profile-${field}`}>{label}</label>
              {/* Keyed, so an error is a new alert element, which screen readers announce. */}
              {error
                ? <p key="error" id={`profile-${field}-note`} role="alert" className={styles.fieldError}>{error}</p>
                : <p key="hint" id={`profile-${field}-note`} className={styles.hint}>{hint}</p>}
              <input
                id={`profile-${field}`}
                name={field}
                {...CONTACT_INPUTS[field]}
                maxLength={64}
                value={contactValues[field]}
                aria-invalid={error ? true : undefined}
                aria-describedby={`profile-${field}-note`}
                onChange={(event) => setContactValues((values) => ({ ...values, [field]: event.target.value }))}
              />
            </div>
          );
        })}
      </fieldset>

      {state && "message" in state && <p role="alert" className={styles.fieldError}>{state.message}</p>}
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
