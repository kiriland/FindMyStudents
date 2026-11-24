import type { ReactNode } from "react";

/**
 * Where the Cloudflare Turnstile widget sits. The widget is usually invisible
 * and only asks for a click when Cloudflare needs one, so a short note says
 * what it is.
 */
export default function TurnstileNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="min-w-0 overflow-hidden empty:hidden">{children}</div>
      <p className="flex items-center gap-2 text-[13px] text-subtle">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4 shrink-0 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        Protected by a quick Cloudflare security check.
      </p>
    </div>
  );
}
