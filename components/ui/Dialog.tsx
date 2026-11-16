"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/Button";
import { focusScope } from "./styles";

let openDialogs = 0;
let previousOverflow = "";

export default function Dialog({
  title,
  onDismiss,
  children,
}: {
  title: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    if (!dialog) return;
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialog.showModal();
    return () => {
      dialog.close();
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`m-auto max-h-[calc(100dvh-48px)] w-[min(760px,calc(100%-32px))] rounded-[18px] border border-zinc-200 dark:border-[#303036] bg-white p-0 text-[#171717] shadow-[0_24px_100px_#0003] backdrop:bg-[#09090b99] backdrop:backdrop-blur-[3px] dark:bg-[#0a0a0a] dark:text-[#ededed] max-[640px]:max-h-[calc(100dvh-24px)] max-[640px]:w-[calc(100%-20px)] max-[640px]:rounded-[14px] ${focusScope}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onDismiss();
      }}
    >
      <div className="sticky top-0 z-1 flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-[#303036] bg-white px-6 py-3.5 dark:bg-[#0a0a0a] max-[640px]:px-4.5 max-[640px]:py-3 [&_p]:text-xs [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400">
        <p>{title}</p>
        <Button variant="close" onClick={onDismiss} autoFocus>
          Close
        </Button>
      </div>
      <div className="p-7 max-[640px]:px-4.5 max-[640px]:py-5.5">
        {children}
      </div>
    </dialog>
  );
}
