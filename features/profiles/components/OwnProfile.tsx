"use client";

import type { ReactNode } from "react";

import { useActionState, useEffect, useRef, useState } from "react";

import { INPUT_CLASS } from "@/components/Input";
import { buttonClass } from "@/components/ui/button";
import {
  ERROR_CLASS,
  HINT_CLASS,
  LABEL_CLASS,
  Spinner,
} from "@/components/ui/Field";

import type { ProfileFormState } from "../actions";
import type { ContactField, Contacts } from "../profile-model";

import { saveProfile } from "../actions";
import {
  BIO_MAX_LENGTH,
  bioLength,
  CONTACT_FIELDS,
  CONTACT_RULES,
} from "../profile-model";
import DeleteAccount from "./DeleteAccount";
import PictureEditor from "./PictureEditor";
import PrivateBadge from "./PrivateBadge";
import {
  ID_CARD,
  PANEL,
  PANEL_BODY,
  PANEL_HEAD,
  PANEL_TITLE,
} from "./profile-styles";

interface OwnProfileProps {
  bio: string;
  hasPicture: boolean;
  pictureUrl: string | null;
  initials: string;
  contacts: Contacts;
  /** The picture, name and Help Offer count at the top of the card. */
  identity: ReactNode;
  /** The read-only contact details, shown in the card outside edit mode. */
  contactDetails: ReactNode;
  /** The read-only bio, shown outside edit mode. */
  about: ReactNode;
  /** The Help Offers, which stay editable in both modes. */
  children: ReactNode;
}

/**
 * The owner's view of their Profile: read-only until they choose Edit profile,
 * then grouped panels for the fields they can change.
 */
export default function OwnProfile({
  bio,
  hasPicture,
  pictureUrl,
  initials,
  contacts,
  identity,
  contactDetails,
  about,
  children,
}: OwnProfileProps) {
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

  return (
    <>
      <aside aria-label="Your profile" className={ID_CARD}>
        {identity}
        {isEditing ? (
          <p className="flex items-center gap-2 rounded-ctl bg-brand-50 px-3 py-2.5 font-display text-sm leading-[1.3] font-medium text-brand-strong">
            <PenIcon />
            You’re editing your profile
          </p>
        ) : (
          <>
            <button
              ref={editButton}
              type="button"
              className={buttonClass({ variant: "secondary", block: true })}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              <PenIcon />
              Edit profile
            </button>
            {contactDetails}
          </>
        )}
      </aside>

      <div className="flex min-w-0 flex-col gap-11">
        {isEditing ? (
          <div className="flex stagger-in flex-col gap-4">
            {/* Outside the form: a picture saves as soon as it is chosen, not with Save. */}
            <PictureEditor
              hasPicture={hasPicture}
              pictureUrl={pictureUrl}
              initials={initials}
            />
            <ProfileForm bio={bio} contacts={contacts} onDone={leaveEditMode} />
            <DeleteAccount />
          </div>
        ) : (
          <div className="animate-fade-up">{about}</div>
        )}
        {children}
      </div>
    </>
  );
}

function PenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 shrink-0 fill-none stroke-current stroke-2 [stroke-linejoin:round]"
    >
      <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
    </svg>
  );
}

// How each contact field is typed. Its label and rules come from the model.
const CONTACT_INPUTS: Record<
  ContactField,
  { type: string; autoComplete: string; placeholder: string }
> = {
  phone: { type: "tel", autoComplete: "tel", placeholder: "+1 (212) 555-0123" },
  discord: { type: "text", autoComplete: "off", placeholder: "username" },
  instagram: { type: "text", autoComplete: "off", placeholder: "handle" },
};

interface FormProps {
  bio: string;
  contacts: Contacts;
  onDone: () => void;
}

function ProfileForm({ bio: savedBio, contacts, onDone }: FormProps) {
  const [bio, setBio] = useState(savedBio);
  // Controlled, so a rejected save keeps what the student typed.
  const [contactValues, setContactValues] = useState<
    Record<ContactField, string>
  >(() => ({
    phone: contacts.phone ?? "",
    discord: contacts.discord ?? "",
    instagram: contacts.instagram ?? "",
  }));
  const [state, formAction, isSaving] = useActionState<
    ProfileFormState,
    FormData
  >(saveProfile, null);

  // Leave edit mode once the save has committed, together with the refreshed
  // Profile, so the old values never flash back.
  useEffect(() => {
    if (state?.ok) {
      onDone();
    }
  }, [state, onDone]);
  const fieldErrors = state && "fieldErrors" in state ? state.fieldErrors : {};
  const length = bioLength(bio);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      aria-label="Edit profile"
    >
      <section className={PANEL} aria-labelledby="profile-bio-title">
        <div className={PANEL_HEAD}>
          <h2 id="profile-bio-title" className={PANEL_TITLE}>
            About you
          </h2>
          <p id="profile-bio-hint" className={`${HINT_CLASS} w-full`}>
            Optional. Tell students what you study and how you like to help.
            Plain text; line breaks are kept.
          </p>
        </div>
        <div className={PANEL_BODY}>
          <label htmlFor="profile-bio" className="sr-only">
            Bio
          </label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={7}
            value={bio}
            autoFocus
            aria-invalid={fieldErrors.bio ? true : undefined}
            aria-describedby={`profile-bio-hint profile-bio-count${fieldErrors.bio ? " profile-bio-error" : ""}`}
            onChange={(event) => {
              setBio(event.target.value);
            }}
            className={`${INPUT_CLASS} min-h-[168px] resize-y leading-relaxed`}
          />
          <p
            id="profile-bio-count"
            className={`-mt-2 self-end text-[13px] tabular-nums transition-colors duration-150 ${length > BIO_MAX_LENGTH ? "font-semibold text-danger" : "text-subtle"}`}
          >
            {length} / {BIO_MAX_LENGTH}
          </p>
          {fieldErrors.bio && (
            <p id="profile-bio-error" role="alert" className={ERROR_CLASS}>
              {fieldErrors.bio}
            </p>
          )}
        </div>
      </section>

      <section
        role="group"
        className={`${PANEL} min-w-0`}
        aria-labelledby="profile-contacts-title"
        aria-describedby="profile-contacts-hint"
      >
        <div className={PANEL_HEAD}>
          <h2 id="profile-contacts-title" className={PANEL_TITLE}>
            Contact details
          </h2>
          <PrivateBadge label="Only you and your Connections" />
          <p id="profile-contacts-hint" className={`${HINT_CLASS} w-full`}>
            Optional. Only students you connect with can see these.
          </p>
        </div>
        <div className={`${PANEL_BODY} grid gap-4 sm:grid-cols-2`}>
          {CONTACT_FIELDS.map((field, index) => {
            const { label, hint } = CONTACT_RULES[field];
            // A rejected value shows the rule it broke as an error, in place of the hint.
            const error = fieldErrors[field];
            return (
              <div
                key={field}
                className={`flex min-w-0 flex-col gap-1.5 ${index === 0 ? "sm:col-span-2" : ""}`}
              >
                <label htmlFor={`profile-${field}`} className={LABEL_CLASS}>
                  {label}
                </label>
                {/* Keyed, so an error is a new alert element, which screen readers announce. */}
                {error ? (
                  <p
                    key="error"
                    id={`profile-${field}-note`}
                    role="alert"
                    className={ERROR_CLASS}
                  >
                    {error}
                  </p>
                ) : (
                  <p
                    key="hint"
                    id={`profile-${field}-note`}
                    className={HINT_CLASS}
                  >
                    {hint}
                  </p>
                )}
                <input
                  id={`profile-${field}`}
                  name={field}
                  {...CONTACT_INPUTS[field]}
                  maxLength={64}
                  value={contactValues[field]}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={`profile-${field}-note`}
                  onChange={(event) => {
                    setContactValues((values) => ({
                      ...values,
                      [field]: event.target.value,
                    }));
                  }}
                  className={INPUT_CLASS}
                />
              </div>
            );
          })}
        </div>
      </section>

      {state && "message" in state && (
        <p role="alert" className={ERROR_CLASS}>
          {state.message}
        </p>
      )}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-card border border-line bg-surface/95 px-[18px] py-3.5 pb-[max(14px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-20px_rgb(30_58_138/0.3)] backdrop-blur-[10px] max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0">
        <p className="max-w-[40ch] text-sm text-subtle">
          Your bio and contact details save when you press Save changes.
        </p>
        <div className="flex gap-2 max-sm:w-full">
          <button
            type="button"
            className={buttonClass({
              variant: "ghost",
              className: "max-sm:flex-1",
            })}
            disabled={isSaving}
            onClick={onDone}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={buttonClass({ className: "max-sm:flex-1" })}
            disabled={isSaving}
          >
            {isSaving && <Spinner />}
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
