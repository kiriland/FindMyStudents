"use client";

import Link from "next/link";
import { COURSE_HEADING_ID, discoveryHref } from "../course-model";
import styles from "../course.module.css";

export default function CourseError({ retry }: { retry: () => void }) {
  return <div className={styles.empty} role="alert"><h1 id={COURSE_HEADING_ID}>Could not load this course</h1><p>Please try again in a moment.</p><div className={styles.detailLinks}><button className={styles.button} type="button" onClick={retry}>Try again</button><Link className={styles.button} href={discoveryHref()}>Browse courses</Link></div></div>;
}
