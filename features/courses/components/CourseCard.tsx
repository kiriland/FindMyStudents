import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import { getDepartment, type CourseSummary } from "../course-model";
import Highlight from "./Highlight";

const HOVER = "group-hover:text-white group-focus-visible:text-white";

/**
 * A course as a catalogue card: a spine with the department and number beside
 * the title and description. Hovering fills the spine with blue.
 */
export default function CourseCard({ course, href, words }: { course: CourseSummary; href: string; words: string[] }) {
  const department = getDepartment(course.courseCode);
  const number = course.courseCode.slice(department.length).trim();
  const descriptionId = `course-${course.courseCode.replace(/[^a-z0-9]/gi, "")}-preview`;
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      aria-label={`${course.courseCode}, ${course.title}`}
      aria-describedby={descriptionId}
      className="group relative grid h-full min-h-[156px] grid-cols-[78px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow,translate,scale] duration-300 ease-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgb(30_58_138/0.45)] focus-visible:-translate-y-0.5 focus-visible:border-brand-200 focus-visible:shadow-[0_0_0_3px_rgb(37_99_235/0.28),0_18px_40px_-24px_rgb(30_58_138/0.45)] focus-visible:outline-none active:translate-y-0 active:scale-[0.99] sm:min-h-[172px] sm:grid-cols-[96px_minmax(0,1fr)] [@media(hover:none)]:hover:translate-y-0"
    >
      <span
        aria-hidden="true"
        className="relative flex flex-col justify-between gap-3 overflow-hidden border-r border-brand-100 bg-brand-50 py-4 pr-3 pl-3.5 before:absolute before:inset-0 before:translate-y-[101%] before:bg-brand before:transition-transform before:duration-[460ms] before:ease-soft before:content-[''] after:absolute after:inset-x-3.5 after:top-1/2 after:h-px after:bg-current after:opacity-20 after:content-[''] group-hover:before:translate-y-0 group-focus-visible:before:translate-y-0 sm:pt-[18px] sm:pr-3.5 sm:pl-4"
      >
        <span className={`relative font-display text-[17px] leading-none font-semibold tracking-[0.01em] text-brand-strong transition-colors duration-300 sm:text-xl ${HOVER}`}>
          {department || course.courseCode}
        </span>
        <span className={`relative font-display leading-none tracking-[-0.03em] text-ink tabular-nums transition-colors duration-300 [overflow-wrap:anywhere] ${number.length > 4 ? "text-[19px] sm:text-[23px]" : "text-[23px] sm:text-[28px]"} ${HOVER}`}>
          {number}
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-2 px-4 pt-4 pb-3 sm:pt-[18px] sm:pr-[18px] sm:pb-3.5 sm:pl-5">
        <span className="font-display text-[17px] leading-[1.3] font-semibold tracking-[-0.015em] text-balance [overflow-wrap:anywhere] sm:text-lg">
          <Highlight text={course.title} words={words} />
        </span>
        <span id={descriptionId} className="line-clamp-2 text-[15px] leading-[1.55] text-muted">
          {course.preview ? <Highlight text={course.preview} words={words} /> : "Open this course to learn more."}
        </span>
        <span aria-hidden="true" className="mt-auto flex items-center justify-between gap-2.5 pt-2">
          <span className="text-[13px] text-subtle">Baruch College</span>
          <span className="inline-flex items-center gap-2 font-display text-sm leading-none font-medium text-brand-strong">
            <span className="translate-x-1.5 opacity-0 transition-[opacity,translate] duration-250 ease-soft group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100">
              View details
            </span>
            <span className="grid size-8 place-items-center rounded-full border border-brand-200 transition-[background-color,border-color,color,translate] duration-250 ease-soft group-hover:translate-x-0.5 group-hover:border-brand group-hover:bg-brand group-hover:text-white group-focus-visible:border-brand group-focus-visible:bg-brand group-focus-visible:text-white">
              <ArrowIcon className="size-4" />
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/** A card-shaped placeholder while results load. */
export function CourseCardSkeleton() {
  return (
    <div className="grid min-h-[156px] shimmer grid-cols-[78px_minmax(0,1fr)] rounded-2xl border border-line bg-surface sm:min-h-[172px] sm:grid-cols-[96px_minmax(0,1fr)]">
      <span className="border-r border-brand-100 bg-brand-50" />
      <span className="flex flex-col gap-3 p-5">
        <i className="block h-5 w-[70%] rounded-md bg-well" />
        <i className="block h-3.5 w-[92%] rounded-md bg-well" />
        <i className="block h-3.5 w-[60%] rounded-md bg-well" />
      </span>
    </div>
  );
}
