import { Suspense } from "react";
import CourseContent from "@/features/dashboard/components/CourseContent";
import type { CourseParams } from "@/features/dashboard/components/CourseContent";
import { CourseLoading } from "@/features/dashboard/components/CourseFeedback";
import styles from "@/features/dashboard/discovery.module.css";

export default function CoursePage({ params }: { params: CourseParams }) {
  return <main className={styles.standalone}><Suspense fallback={<CourseLoading />}><CourseContent params={params} /></Suspense></main>;
}
