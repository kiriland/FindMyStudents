import { Suspense } from "react";
import ClassSearch from "./ClassSearch";
import styles from "../discovery.module.css";

export default function Dashboard() {
  return (
    <main className={styles.discovery}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Baruch College</p>
        <h1>Find your course.</h1>
        <p>Explore courses and find students offering to help.</p>
      </header>
      <Suspense fallback={<p role="status">Loading course search…</p>}><ClassSearch /></Suspense>
    </main>
  );
}
