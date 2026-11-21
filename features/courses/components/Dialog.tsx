"use client";

import { useEffect, useRef } from "react";

import { buttonClass } from "@/components/ui/button";

let openDialogs = 0;
let previousOverflow = "";

/**
 * A modal side panel (a bottom sheet on small screens). The native <dialog>
 * keeps focus inside and closes on Esc; clicking the backdrop dismisses it.
 */
export default function Dialog({
  title,
  labelledBy,
  onDismiss,
  children,
}: {
  /** Shown in the dialog bar; also the accessible name unless `labelledBy` resolves. */
  title: string;
  labelledBy?: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    if (!dialog) {
      return;
    }
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialog.showModal();
    return () => {
      dialog.close();
      if (--openDialogs === 0) {
        document.body.style.overflow = previousOverflow;
      }
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          onDismiss();
        }
      }}
    >
      <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-line py-3 pr-4 pl-7 max-sm:pt-[22px] max-sm:pr-3 max-sm:pb-2.5 max-sm:pl-5">
        <span
          aria-hidden="true"
          className="absolute top-[7px] left-1/2 hidden h-[5px] w-10 -translate-x-1/2 rounded-[3px] bg-line-strong max-sm:block"
        />
        <p className="font-display text-sm leading-none font-medium text-subtle">
          {title}
        </p>
        <button
          type="button"
          className={buttonClass({ variant: "secondary", size: "sm" })}
          onClick={onDismiss}
          autoFocus
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-7 pt-6 pb-12 max-sm:px-5 max-sm:pt-5 max-sm:pb-10">
        {children}
      </div>
    </dialog>
  );
}
