"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

type AccountMenuProps = {
  email: string | null;
  profileHref: string;
  onLogout: () => void;
  onProfileClick?: () => void;
  loggingOut?: boolean;
};

/**
 * The signed-in student's email (or "Signed in") as a menu button, following the WAI-ARIA
 * menu button pattern: Esc closes and refocuses the button, arrow keys,
 * Home and End move between items, and clicking outside closes the menu.
 */
export default function AccountMenu({ email, profileHref, onLogout, onProfileClick, loggingOut = false }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Which item to focus once the menu has rendered open.
  const pendingFocus = useRef<"first" | "last" | null>(null);
  const menuId = useId();

  function items() {
    return Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  }

  function open(focus: "first" | "last") {
    pendingFocus.current = focus;
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    const menuItems = items();
    if (pendingFocus.current) {
      menuItems.at(pendingFocus.current === "first" ? 0 : -1)?.focus();
      pendingFocus.current = null;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    // Esc is handled on the document so it works wherever focus is.
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
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

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      open("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      open("last");
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const menuItems = items();
    const current = menuItems.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => menuItems.at(index % menuItems.length)?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current <= 0 ? -1 : current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(-1);
        break;
      case "Tab":
        close();
        break;
    }
  }

  return (
    <div ref={rootRef} className={styles.menuRoot}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.menuButton}
        title={email ?? undefined}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => (isOpen ? close() : open("first"))}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={styles.menuLabel}>{email ?? "Signed in"}</span>
        <span aria-hidden="true" className={styles.caret}>▾</span>
      </button>
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Account"
        className={styles.menu}
        hidden={!isOpen}
        onKeyDown={handleMenuKeyDown}
      >
        <Link
          href={profileHref}
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            close();
            onProfileClick?.();
          }}
        >
          Profile
        </Link>
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          disabled={loggingOut}
          onClick={() => {
            close();
            onLogout();
          }}
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </div>
  );
}
