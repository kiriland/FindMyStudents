import styles from "./Landing.module.css";

export default function Landing() {
  return (
    <main className={styles.landing}>
      <div className={styles.content}>
        <h1>FindMyStudents</h1>
        <p>
          FindMyStudents is a platform that connects students with tutors and
          educational resources. Whether you&apos;re looking for help with a
          specific subject or want to improve your overall academic performance,
          FindMyStudents can help you find the right support.
        </p>
      </div>
    </main>
  );
}
