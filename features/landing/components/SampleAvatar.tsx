/** Initials in a circle, for illustrations only. Real Profiles use the Profiles Avatar. */
export default function SampleAvatar({ initials, className = "size-11 text-[15px]" }: { initials: string; className?: string }) {
  return (
    <span className={`inline-grid flex-none place-items-center rounded-full bg-brand-100 font-display leading-none font-semibold text-brand-strong ${className}`}>
      {initials}
    </span>
  );
}
