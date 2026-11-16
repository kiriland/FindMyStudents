import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getCourse } from "../course-catalogue";
import { COURSE_HEADING_ID, discoveryHref, EMPTY_QUERY, getDepartment } from "../course-model";
import { getVolunteers } from "../volunteers";
import CourseDescription from "./CourseDescription";
import VolunteerList from "./VolunteerList";
import styles from "../discovery.module.css";

export type CourseParams = Promise<{ school: string; courseCode: string }>;

export default async function CourseContent({ params }: { params: CourseParams }) {
  await connection();
  const { school, courseCode } = await params;
  const course = await getCourse(school, courseCode);
  if (!course) notFound();
  const department = getDepartment(course.courseCode);
  const volunteers = await getVolunteers(course);
  return (
    <article key={`${course.school}:${course.courseCode}`}>
      <nav aria-label="Breadcrumb"><ol className={styles.breadcrumbs}>
        <li><Link href={discoveryHref()} prefetch={false}>Courses</Link></li>
        {department && <li><Link href={discoveryHref({ ...EMPTY_QUERY, department })} prefetch={false}>{department}</Link></li>}
        <li aria-current="page">{course.courseCode}</li>
      </ol></nav>
      <header className={styles.courseHeading}><span className={styles.courseCode}>{course.courseCode}</span><h1 id={COURSE_HEADING_ID}>{course.title}</h1></header>
      <CourseDescription description={course.description} sourceUrl={course.sourceUrl} />
      <VolunteerList volunteers={volunteers} courseCode={course.courseCode} />
    </article>
  );
}
