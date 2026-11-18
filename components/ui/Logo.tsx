import Link from "next/link";

/** The folded "F" mark, drawn as SVG so it stays sharp at any size. */
export function LogoMark({ className = "size-[34px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <path
        className="fill-navy"
        d="M7 15.5C7 11.6 10.6 9 14.3 10.3L21 12.9 49.6 3.6C52.8 2.6 56 5 56 8.3V16.2C56 18.3 54.7 20.1 52.7 20.8L23.4 30.6C21.4 31.3 20 33.2 20 35.3V57.8L9.9 53.1C8.2 52.3 7 50.5 7 48.6Z"
      />
      <path
        className="fill-brand"
        d="M24 38.4C24 36.3 25.3 34.4 27.3 33.7L50.7 25.3C53.3 24.4 56 26.3 56 29V37.7C56 39.8 54.7 41.7 52.7 42.4L33.6 49.6C29.6 51.1 26.3 53.3 24 56.6Z"
      />
    </svg>
  );
}

/** The mark and the wordmark, linking home. */
export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-2.5 rounded-md font-display text-[19px] leading-none font-semibold tracking-[-0.025em] text-ink"
    >
      <LogoMark />
      <span>
        FindMy<span className="text-brand">Students</span>
      </span>
    </Link>
  );
}
