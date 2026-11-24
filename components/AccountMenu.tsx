"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { ChevronIcon } from "@/components/ui/icons";

interface AccountMenuProps {
  email: string | null;
  profileHref: string;
  profileBadge?: React.ReactNode;
  onLogout: () => void;
  loggingOut: boolean;
}

const ITEM =
  "block w-full cursor-pointer rounded-lg px-2.5 py-[9px] text-left font-semibold text-ink-2 transition-colors duration-150 hover:bg-well hover:text-ink focus-visible:bg-well focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The signed-in student's email (or "Logged in") as a button that discloses
 * their account links. Esc closes it and refocuses the button; so does a click
 * outside, without moving focus.
 */
export default function AccountMenu({
  email,
  profileHref,
  profileBadge,
  onLogout,
  loggingOut,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const initial = email?.trim()[0]?.toUpperCase() ?? "";

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (
        !(event.target instanceof Node) ||
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
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
        className="flex max-w-60 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface py-[3px] pr-2.5 pl-[3px] font-display text-sm leading-none font-medium text-ink-2 transition-colors duration-150 hover:border-line-strong aria-expanded:border-brand-200"
        title={email ?? undefined}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <span
          aria-hidden="true"
          className="grid size-[34px] shrink-0 place-items-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-strong"
        >
          {initial || "•"}
        </span>
        <span className="truncate">{email ?? "Logged in"}</span>
        {profileBadge}
        <ChevronIcon
          className={`size-4 text-subtle transition-transform duration-250 ease-soft ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {/* Kept in the page so it can animate; invisible (and out of the tab order) while closed. */}
      <div
        id={panelId}
        className={`absolute top-[calc(100%+8px)] right-0 z-50 min-w-[220px] rounded-xl border border-line bg-surface p-1.5 shadow-float transition-[opacity,translate,visibility] duration-250 ease-soft ${
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1.5 opacity-0"
        }`}
      >
        <div className="mb-1 border-b border-line px-2.5 pt-2.5 pb-2">
          <span className="block text-[13px] text-subtle">Logged in as</span>
          <strong className="block truncate font-display text-sm font-semibold">
            {email ?? "your account"}
          </strong>
        </div>
        <Link
          href={profileHref}
          className={ITEM}
          onClick={() => {
            setIsOpen(false);
          }}
        >
          Your profile{profileBadge}
        </Link>
        <button
          type="button"
          disabled={loggingOut}
          className={ITEM}
          onClick={() => {
            setIsOpen(false);
            onLogout();
          }}
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </div>
  );
}
