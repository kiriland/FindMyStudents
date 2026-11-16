import Link from "next/link";
import styles from "../profile.module.css";

export function ProfileLoading() {
  return <p role="status" className={styles.status}>Loading profile…</p>;
}

export function ProfileNotFound() {
  return (
    <div className={styles.empty}>
      <h1>Profile not found</h1>
      <p>No student has this profile link. Check that the link is complete.</p>
      <Link className={styles.button} href="/dashboard">Browse courses</Link>
    </div>
  );
}
