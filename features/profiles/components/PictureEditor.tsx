"use client";

import { useRef, useState, useTransition } from "react";

import { buttonClass } from "@/components/ui/button";
import { ERROR_CLASS, HINT_CLASS, Spinner } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";

import {
  confirmPicture,
  deletePicture,
  requestPictureUpload,
} from "../actions";
import {
  checkPictureFile,
  PICTURE_SIZE_ERROR,
  PICTURE_TYPES,
} from "../profile-model";
import Avatar from "./Avatar";
import { PANEL, PANEL_BODY, PANEL_HEAD, PANEL_TITLE } from "./profile-styles";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "removing" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

const UPLOAD_FAILED = "Your picture could not be uploaded. Please try again.";

function uploadLabel(isSaving: boolean, hasPicture: boolean) {
  if (isSaving) {
    return "Checking and saving…";
  }
  return hasPicture ? "Replace picture" : "Upload picture";
}

async function save(file: File): Promise<Status> {
  const started = await requestPictureUpload(file.type, file.size);
  if (!started.ok) {
    return { kind: "error", message: started.message };
  }
  const body = new FormData();
  for (const [name, value] of Object.entries(started.upload.fields)) {
    body.append(name, value);
  }
  // S3 reads the form fields in order and needs the file last.
  body.append("file", file);
  const response = await fetch(started.upload.url, { method: "POST", body });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      kind: "error",
      message: text.includes("EntityTooLarge")
        ? PICTURE_SIZE_ERROR
        : UPLOAD_FAILED,
    };
  }
  const confirmed = await confirmPicture(started.upload.uploadId);
  return confirmed.ok
    ? { kind: "done", message: "Picture saved." }
    : { kind: "error", message: confirmed.message };
}

async function clear(): Promise<Status> {
  const result = await deletePicture();
  return result.ok
    ? { kind: "done", message: "Picture removed." }
    : { kind: "error", message: result.message };
}

/**
 * Uploads, replaces or removes the owner's picture. Each change saves straight
 * away, apart from the rest of the edit form.
 */
export default function PictureEditor({
  hasPicture,
  pictureUrl,
  initials,
}: {
  hasPicture: boolean;
  pictureUrl: string | null;
  initials: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const busy =
    isPending || status.kind === "saving" || status.kind === "removing";

  /** Shows `pending` while `change` runs, then its outcome, or `failure` if it throws (e.g. the network drops). */
  function run(
    pending: Status,
    change: () => Promise<Status>,
    failure: string,
  ) {
    setStatus(pending);
    startTransition(async () => {
      setStatus(
        await change().catch((): Status => ({
          kind: "error",
          message: failure,
        })),
      );
    });
  }

  function upload(file: File) {
    const check = checkPictureFile(file.type, file.size);
    if (check.ok) {
      run({ kind: "saving" }, async () => save(file), UPLOAD_FAILED);
    } else {
      setStatus({ kind: "error", message: check.error });
    }
  }

  function remove() {
    run(
      { kind: "removing" },
      clear,
      "Your picture could not be removed. Please try again.",
    );
  }

  return (
    <section
      className={PANEL}
      role="group"
      aria-labelledby="profile-picture-label"
    >
      <div className={PANEL_HEAD}>
        <h2 id="profile-picture-label" className={PANEL_TITLE}>
          Profile picture
        </h2>
        <SavesNow />
        <p id="profile-picture-hint" className={`${HINT_CLASS} w-full`}>
          Optional. JPEG or PNG, up to 5 MB. Shown as a square to signed-in
          students. It’s checked before it appears, and location and other photo
          details are removed.
        </p>
      </div>
      <div className={PANEL_BODY}>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`relative transition-opacity duration-250 ${busy ? "opacity-60" : ""}`}
          >
            <Avatar size="medium" initials={initials} pictureUrl={pictureUrl} />
            {busy && (
              <span className="absolute inset-0 grid place-items-center text-brand-strong">
                <Spinner />
              </span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass({ variant: "secondary", size: "sm" })}
              disabled={busy}
              aria-describedby="profile-picture-hint"
              onClick={() => fileInput.current?.click()}
            >
              {uploadLabel(status.kind === "saving", hasPicture)}
            </button>
            {hasPicture && (
              <button
                type="button"
                className={buttonClass({ variant: "ghost", size: "sm" })}
                disabled={busy}
                onClick={remove}
              >
                {status.kind === "removing" ? "Removing…" : "Remove picture"}
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={PICTURE_TYPES.join(",")}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Clear it, so choosing the same file again still uploads it.
            event.target.value = "";
            if (file) {
              upload(file);
            }
          }}
        />
        {status.kind === "error" ? (
          <p role="alert" className={ERROR_CLASS}>
            {status.message}
          </p>
        ) : (
          <p
            role="status"
            className={`${HINT_CLASS} empty:-mt-4 ${status.kind === "done" ? "font-medium text-success" : ""}`}
          >
            {status.kind === "done" ? status.message : ""}
          </p>
        )}
      </div>
    </section>
  );
}

/** Says a panel's changes save without pressing Save. */
export function SavesNow({
  label = "Saves straight away",
}: {
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-[5px] font-display text-xs leading-[1.2] font-medium text-success">
      <CheckIcon className="size-[13px]" />
      {label}
    </span>
  );
}
