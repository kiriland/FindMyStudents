"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

type AccountMenuProps = {
  email: string | null;
  profileHref: string;
  onLogout: () => void;
  loggingOut: boolean;
};

const ITEM = "block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none disabled:opacity-50";

/**
 * The signed-in student's email (or "Signed in") as a button that discloses
 * their account links. Esc closes it and refocuses the button; so does a click
 * outside, without moving focus.
 */
export default function AccountMenu({ email, profileHref, onLogout, loggingOut }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        className="flex max-w-56 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        title={email ?? undefined}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="truncate">{email ?? "Signed in"}</span>
        <span aria-hidden="true" className="shrink-0">▾</span>
      </button>
      <div
        id={panelId}
        className="absolute right-0 top-full z-50 mt-1 flex min-w-40 flex-col rounded-xl border border-zinc-200 bg-white p-1 shadow-lg [&[hidden]]:hidden"
        hidden={!isOpen}
      >
        <Link href={profileHref} className={ITEM} onClick={() => setIsOpen(false)}>Profile</Link>
        <button
          type="button"
          disabled={loggingOut}
          className={ITEM}
          onClick={() => {
            setIsOpen(false);
            onLogout();
          }}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </div>
  );
}
