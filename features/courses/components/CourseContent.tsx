import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCourse } from "../course-catalogue";
import { COURSE_HEADING_ID, discoveryHref, EMPTY_QUERY, getDepartment } from "../course-model";
import CourseVolunteers from "@/features/profiles/components/CourseVolunteers";
import CourseDescription from "./CourseDescription";

export type CourseParams = Promise<{ school: string; courseCode: string }>;

const CRUMB = "rounded-sm text-muted transition-colors duration-150 hover:text-brand-strong hover:underline hover:underline-offset-[3px]";

export default async function CourseContent({ params }: { params: CourseParams }) {
  await connection();
  const { school, courseCode } = await params;
  const course = await getCourse(school, courseCode);
  if (!course) notFound();
  const department = getDepartment(course.courseCode);
  const number = course.courseCode.slice(department.length).trim();
  return (
    <article key={`${course.school}:${course.courseCode}`} className="stagger-in">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-subtle">
          <li><Link href={discoveryHref()} prefetch={false} className={CRUMB}>Courses</Link></li>
          {department && (
            <>
              <li aria-hidden="true">/</li>
              <li><Link href={discoveryHref({ ...EMPTY_QUERY, department })} prefetch={false} className={CRUMB}>{department}</Link></li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-ink">{course.courseCode}</li>
        </ol>
      </nav>
      <header className="mt-[22px]">
        <p className="font-display text-[clamp(36px,7vw,48px)] leading-none tracking-[-0.02em] whitespace-nowrap text-ink tabular-nums">
          {department ? <><b className="font-semibold text-brand-strong">{department}</b> {number}</> : course.courseCode}
        </p>
        <h1 id={COURSE_HEADING_ID} className="mt-2.5 font-display text-[clamp(22px,3vw,26px)] leading-[1.22] font-semibold tracking-[-0.025em]">
          {course.title}
        </h1>
      </header>
      <CourseDescription description={course.description} sourceUrl={course.sourceUrl} />
      <CourseVolunteers courseCode={course.courseCode} />
    </article>
  );
}
