import { Suspense } from "react";
import CourseContent from "@/features/courses/components/CourseContent";
import type { CourseParams } from "@/features/courses/components/CourseContent";
import { CourseLoading } from "@/features/courses/components/CourseFeedback";
import styles from "@/features/courses/course.module.css";

export default function CoursePage({ params }: { params: CourseParams }) {
  return <main className={styles.standalone}><Suspense fallback={<CourseLoading />}><CourseContent params={params} /></Suspense></main>;
}
