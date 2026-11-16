"use client";

import Link from "next/link";
import styles from "../discovery.module.css";

export default function CourseError({ retry }: { retry: () => void }) {
  return <div className={styles.empty} role="alert"><h1>Could not load this course</h1><p>Please try again in a moment.</p><div className={styles.detailLinks}><button className={styles.button} type="button" onClick={retry}>Try again</button><Link className={styles.button} href="/dashboard">Browse courses</Link></div></div>;
}
