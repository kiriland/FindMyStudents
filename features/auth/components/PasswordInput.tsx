"use client";

import type { InputHTMLAttributes } from "react";

import { useState } from "react";

import { INPUT_CLASS } from "@/components/Input";
import { HINT_CLASS } from "@/components/ui/Field";
import { InfoIcon } from "@/components/ui/icons";

/** A password field with a show/hide toggle and a Caps Lock warning. */
export default function PasswordInput({
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const capsId = `${id}-caps`;

  function checkCapsLock(event: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  return (
    <>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={
            [props["aria-describedby"], capsLock ? capsId : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onKeyDown={checkCapsLock}
          onKeyUp={checkCapsLock}
          onBlur={() => {
            setCapsLock(false);
          }}
          className={`${INPUT_CLASS} pr-12`}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => {
            setVisible((value) => !value);
          }}
          className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-subtle transition-colors duration-150 hover:bg-well hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {capsLock && (
        <p
          id={capsId}
          className={`${HINT_CLASS} flex items-center gap-1.5 text-ink-2`}
        >
          <InfoIcon className="size-4 text-brand-strong" />
          Caps Lock is on
        </p>
      )}
    </>
  );
}
