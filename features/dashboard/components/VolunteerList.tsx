import Link from "next/link";
import type { CourseVolunteers } from "@/features/profiles/profiles";
import styles from "../discovery.module.css";

/**
 * A Course's Volunteers: cards for signed-in students, only a count for
 * signed-out visitors. What a viewer may see is decided before it gets here.
 */
export default function VolunteerList({ volunteers, courseCode, loginHref }: { volunteers: CourseVolunteers; courseCode: string; loginHref: string }) {
  const count = volunteers.visibility === "cards" ? volunteers.volunteers.length : volunteers.count;
  return (
    <section className={styles.volunteerSection} aria-labelledby="volunteers-heading">
      <h2 id="volunteers-heading" className={styles.volunteerHeading}>Students offering to help</h2>
      {count === 0 ? (
        <div className={styles.empty}><h2>No volunteers yet</h2><p>Nobody has offered to help with {courseCode} yet. You can still explore the course details above.</p></div>
      ) : volunteers.visibility === "count" ? (
        <p className={styles.volunteerCount}>
          {count === 1 ? "1 student offers" : `${count} students offer`} help — <Link href={loginHref}>sign in to see them</Link>
        </p>
      ) : (
        <ul className={styles.volunteers}>
          {volunteers.volunteers.map((volunteer) => (
            <li key={volunteer.id}>
              <Link href={volunteer.href} prefetch={false} className={styles.volunteerCard}>
                <span className={styles.avatar} aria-hidden="true">{volunteer.initials}</span>
                <span>
                  <span className={styles.volunteerName}>{volunteer.displayName}</span>
                  {volunteer.bioExcerpt && <span className={styles.volunteerBio}>{volunteer.bioExcerpt}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
