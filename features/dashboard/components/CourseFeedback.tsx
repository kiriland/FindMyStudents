import Link from "next/link";
import { COURSE_HEADING_ID, discoveryHref } from "../course-model";
import styles from "../discovery.module.css";

export function CourseLoading() {
  return <p role="status" className={styles.demoNote}>Loading course details…</p>;
}

export function CourseNotFound() {
  return <div className={styles.empty}><h1 id={COURSE_HEADING_ID}>Course not found</h1><p>This course is not in the current catalogue.</p><Link className={styles.button} href={discoveryHref()}>Browse courses</Link></div>;
}
