import Link from "next/link";
import styles from "../discovery.module.css";

export function CourseLoading() {
  return <p role="status" className={styles.demoNote}>Loading course details…</p>;
}

export function CourseNotFound() {
  return <div className={styles.empty}><h1>Course not found</h1><p>This course is not in the current catalogue.</p><Link className={styles.button} href="/dashboard">Browse courses</Link></div>;
}
