import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCourse } from "../classes-service";
import { discoveryHref, getDepartment } from "../course-model";
import { getVolunteers } from "../volunteers";
import CourseDescription from "./CourseDescription";
import VolunteerList from "./VolunteerList";

export type CourseParams = Promise<{ school: string; courseCode: string }>;

export default async function CourseContent({
  params,
}: {
  params: CourseParams;
}) {
  await connection();
  const { school, courseCode } = await params;
  const course = await getCourse(school, courseCode);
  if (!course) notFound();
  const department = getDepartment(course.courseCode);
  const volunteers = await getVolunteers(course);
  return (
    <article key={`${course.school}:${course.courseCode}`}>
      <nav aria-label="Breadcrumb">
        <ol className="mb-7 flex list-none flex-wrap gap-2 p-0 text-[13px] text-zinc-500 dark:text-zinc-400 [&>li+li]:before:mr-2 [&>li+li]:before:text-zinc-400 [&>li+li]:before:content-['/'] [&_a:hover]:underline [&_a:hover]:underline-offset-4 [&_[aria-current]]:text-[#171717] dark:[&_[aria-current]]:text-[#ededed]">
          <li>
            <Link href={discoveryHref()} prefetch={false}>
              Courses
            </Link>
          </li>
          {department && (
            <li>
              <Link
                href={discoveryHref({ search: "", department, page: 1 })}
                prefetch={false}
              >
                {department}
              </Link>
            </li>
          )}
          <li aria-current="page">{course.courseCode}</li>
        </ol>
      </nav>
      <header>
        <Badge>{course.courseCode}</Badge>
        <h1 className="mt-4 text-[clamp(26px,4vw,36px)] leading-[1.2] font-bold tracking-[-.035em]">
          {course.title}
        </h1>
      </header>
      <CourseDescription
        description={course.description}
        sourceUrl={course.sourceUrl}
      />
      <VolunteerList volunteers={volunteers} courseCode={course.courseCode} />
    </article>
  );
}
