/**
 * A student's picture as a square crop in a circle, or their initials when
 * they have none. Decorative: the name is always shown next to it.
 */
export default function Avatar({ initials, pictureUrl, className }: { initials: string; pictureUrl: string | null; className: string }) {
  return (
    <span className={className} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed links change every few minutes, so Next's image optimizer couldn't cache them. */}
      {pictureUrl ? <img src={pictureUrl} alt="" /> : initials}
    </span>
  );
}
