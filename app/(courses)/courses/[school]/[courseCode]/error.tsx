"use client";

import CourseError from "@/features/courses/components/CourseError";
import styles from "@/features/courses/course.module.css";

export default function Error({ retry }: { retry: () => void }) {
  return <main className={styles.standalone}><CourseError retry={retry} /></main>;
}
