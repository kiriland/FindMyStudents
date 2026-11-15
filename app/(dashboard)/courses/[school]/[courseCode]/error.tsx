"use client";

import CourseError from "@/features/dashboard/components/CourseError";
import styles from "@/features/dashboard/discovery.module.css";

export default function Error({ retry }: { retry: () => void }) {
  return <main className={styles.standalone}><CourseError retry={retry} /></main>;
}
