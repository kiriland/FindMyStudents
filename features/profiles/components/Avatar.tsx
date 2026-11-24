const SIZES = {
  small: "size-11 text-[15px]",
  medium: "size-[72px] text-2xl",
  large: "size-[96px] text-[34px] sm:size-[120px] sm:text-[42px]",
};

/**
 * A student's picture as a square crop in a circle, or their initials when
 * they have none. Decorative: the name is always shown next to it.
 */
export default function Avatar({
  initials,
  pictureUrl,
  size,
}: {
  initials: string;
  pictureUrl: string | null;
  size: keyof typeof SIZES;
}) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-display leading-none font-semibold tracking-[-0.02em] text-brand-strong ${SIZES[size]}`}
      aria-hidden="true"
    >
      {pictureUrl ? (
        // oxlint-disable-next-line nextjs/no-img-element -- signed links change every few minutes, so Next's image optimizer couldn't cache them.
        <img src={pictureUrl} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
