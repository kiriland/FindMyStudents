export default function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-[#252348] dark:text-indigo-200"
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
