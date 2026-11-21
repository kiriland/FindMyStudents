/** Marks information only its owner (and, for contact details, their Connections) can see. */
export default function PrivateBadge({ label = "Only visible to you" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-[5px] rounded-full bg-well px-[9px] py-[3px] font-display text-xs leading-[1.2] font-medium whitespace-nowrap text-muted">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 fill-none stroke-current stroke-2">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {label}
    </span>
  );
}
