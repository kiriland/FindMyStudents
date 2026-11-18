import Link from "next/link";
import { Suspense } from "react";
import CourseSearch from "./CourseSearch";
import styles from "../directory.module.css";

export default function Dashboard() {
  return (
    <main className={styles.directory}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}><span /> Baruch College · Course directory</p>
            <h1>Find your course.<br /><span>Build your community.</span></h1>
            <p className={styles.intro}>Explore the catalog, discover your next class, and connect with students ready to help.</p>
          </div>
          <div className={styles.heroNote}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 5 9-2 9 2v15l-9-2-9 2V5Zm9-2v15" /></svg>
            <p>Your next connection<br /><strong>starts with a course.</strong></p>
          </div>
        </header>
        <section id="explore-classes" aria-label="Explore Baruch courses" className={styles.courseSection}>
          <Suspense fallback={<div className={styles.empty} role="status">Loading course directory…</div>}>
            <CourseSearch />
          </Suspense>
        </section>
        <aside className={styles.guidance}>
          <div><h2>A little help goes a long way.</h2><p>Open a course to explore its details and discover students offering to help.</p></div>
          <Link href="/">About FindMyStudents <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </main>
  );
}
