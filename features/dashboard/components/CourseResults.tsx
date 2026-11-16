import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { courseHref, type CoursePage } from "../course-model";

export function CourseResults({
  courses,
  query,
  loading,
}: {
  courses: CoursePage["courses"];
  query: string;
  loading: boolean;
}) {
  return (
    <ul
      className="list-none overflow-hidden rounded-[14px] border border-zinc-200 dark:border-[#303036] p-0 [&>li+li]:border-t [&>li+li]:border-zinc-200 dark:[&>li+li]:border-[#303036]"
      aria-busy={loading}
    >
      {courses.map((course) => (
        <li key={course.courseCode}>
          <Link
            href={`${courseHref(course)}${query ? `?${query}` : ""}`}
            prefetch={false}
            scroll={false}
            className="grid grid-cols-[106px_1fr_auto] items-start gap-5 p-[23px] text-inherit no-underline transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-900 max-[640px]:grid-cols-1 max-[640px]:gap-2.5 max-[640px]:p-5"
          >
            <Badge>{course.courseCode}</Badge>
            <div>
              <h2 className="text-base leading-[1.4] font-[650]">
                {course.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm leading-[1.6] text-zinc-500 dark:text-zinc-400">
                {course.preview || "Open this course to learn more."}
              </p>
            </div>
            <span
              className="pt-1.25 text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400 max-[640px]:hidden"
              aria-hidden="true"
            >
              View course ↗
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CourseResultsLoading() {
  return (
    <div
      className="rounded-[14px] border border-zinc-200 dark:border-[#303036] px-6 [&>div]:h-[116px] [&>div+div]:border-t [&>div+div]:border-zinc-200 dark:[&>div+div]:border-[#303036] [&>div]:bg-[linear-gradient(#f4f4f5_0_0),linear-gradient(#f4f4f5_0_0)] dark:[&>div]:bg-[linear-gradient(#27272a_0_0),linear-gradient(#27272a_0_0)] [&>div]:bg-position-[0_25px,0_53px] [&>div]:bg-size-[35%_14px,90%_12px] [&>div]:bg-no-repeat"
      aria-label="Loading courses"
      aria-busy="true"
    >
      <div />
      <div />
      <div />
    </div>
  );
}
