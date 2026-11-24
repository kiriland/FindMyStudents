const SIZES = {
  sm: "px-[7px] py-[3px] text-xs",
  md: "px-[9px] py-[5px] text-sm",
};
const TONES = {
  soft: "border-brand-50 bg-brand-50",
  outline: "border-brand-100 bg-surface",
};

/**
 * A course code set as a small tag, with the department in a heavier weight
 * so codes scan quickly in lists. Used everywhere a course code appears.
 */
export default function CourseTag({
  code,
  size = "md",
  tone = "soft",
}: {
  code: string;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
}) {
  const match = /^([a-z]+)\s*(.*)$/i.exec(code.trim());
  return (
    <span
      className={`inline-flex items-center rounded-tag border font-display leading-none font-normal whitespace-nowrap text-brand-strong tabular-nums ${SIZES[size]} ${TONES[tone]}`}
    >
      {match ? (
        <>
          <b className="font-semibold">{match[1]?.toUpperCase()}</b>
          {match[2] && <>&nbsp;{match[2]}</>}
        </>
      ) : (
        code
      )}
    </span>
  );
}
