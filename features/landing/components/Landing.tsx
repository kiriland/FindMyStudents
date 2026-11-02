import styles from "./Landing.module.css";

export default function Landing() {
  return (
    <main className={styles.landing}>
      <div className={styles.content}>
        <h1>FindMyStudents</h1>
        <p>
          FindMyStudents is a platform that connects Baruch students with peers.
        </p>
      </div>
    </main>
  );
}
