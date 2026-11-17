"use client";

import { useRef, useState, useTransition } from "react";
import { confirmPicture, deletePicture, requestPictureUpload } from "../actions";
import { checkPictureFile, PICTURE_SIZE_ERROR, PICTURE_TYPES } from "../profile-fields";
import styles from "../profile.module.css";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "removing" } | { kind: "done"; message: string } | { kind: "error"; message: string };

const UPLOAD_FAILED = "Your picture could not be uploaded. Please try again.";

/**
 * Uploads, replaces or removes the owner's picture. Each change saves straight
 * away, apart from the rest of the edit form.
 */
export default function PictureEditor({ hasPicture }: { hasPicture: boolean }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = isPending || status.kind === "saving" || status.kind === "removing";

  function upload(file: File) {
    const check = checkPictureFile(file.type, file.size);
    if (!check.ok) {
      setStatus({ kind: "error", message: check.error });
      return;
    }
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const started = await requestPictureUpload(file.type, file.size);
      if (!started.ok) {
        setStatus({ kind: "error", message: started.message });
        return;
      }
      const body = new FormData();
      for (const [name, value] of Object.entries(started.upload.fields)) body.append(name, value);
      // S3 reads the form fields in order and needs the file last.
      body.append("file", file);
      try {
        const response = await fetch(started.upload.url, { method: "POST", body });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          setStatus({ kind: "error", message: text.includes("EntityTooLarge") ? PICTURE_SIZE_ERROR : UPLOAD_FAILED });
          return;
        }
      } catch {
        setStatus({ kind: "error", message: UPLOAD_FAILED });
        return;
      }
      const confirmed = await confirmPicture(started.upload.uploadId);
      setStatus(confirmed.ok ? { kind: "done", message: "Picture saved." } : { kind: "error", message: confirmed.message });
    });
  }

  function remove() {
    setStatus({ kind: "removing" });
    startTransition(async () => {
      const result = await deletePicture();
      setStatus(result.ok ? { kind: "done", message: "Picture removed." } : { kind: "error", message: result.message });
    });
  }

  return (
    <div className={`${styles.field} ${styles.pictureField}`} role="group" aria-labelledby="profile-picture-label">
      <span id="profile-picture-label" className={styles.label}>Profile picture</span>
      <p id="profile-picture-hint" className={styles.hint}>
        Optional. JPEG or PNG, up to 5 MB. Shown as a square to signed-in students. Location and other photo details
        are removed. Changes save straight away.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          aria-describedby="profile-picture-hint"
          onClick={() => fileInput.current?.click()}
        >
          {status.kind === "saving" ? "Saving…" : hasPicture ? "Replace picture" : "Upload picture"}
        </button>
        {hasPicture && (
          <button type="button" className={styles.button} disabled={busy} onClick={remove}>
            {status.kind === "removing" ? "Removing…" : "Remove picture"}
          </button>
        )}
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
          if (file) upload(file);
        }}
      />
      {status.kind === "error" ? (
        <p role="alert" className={styles.fieldError}>{status.message}</p>
      ) : (
        <p role="status" className={styles.hint}>{status.kind === "done" ? status.message : ""}</p>
      )}
    </div>
  );
}
