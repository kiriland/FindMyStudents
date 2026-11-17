import Link from "next/link";
import type { CourseVolunteers } from "@/features/profiles/profiles";
import styles from "../discovery.module.css";

/**
 * A Course's Volunteers: cards for signed-in students, only a count for
 * signed-out visitors. What a viewer may see is decided before it gets here.
 */
export default function VolunteerList({ volunteers, courseCode, loginHref }: { volunteers: CourseVolunteers; courseCode: string; loginHref: string }) {
  return (
    <section className={styles.volunteerSection} aria-labelledby="volunteers-heading">
      <h2 id="volunteers-heading" className={styles.volunteerHeading}>Students offering to help</h2>
      {volunteers.visibility === "count" ? (
        volunteers.count ? (
          <p className={styles.volunteerCount}>
            {volunteers.count === 1 ? "1 student offers" : `${volunteers.count} students offer`} help — <Link href={loginHref}>sign in to see them</Link>
          </p>
        ) : <NoVolunteers courseCode={courseCode} />
      ) : volunteers.cards.length ? (
        <ul className={styles.volunteers}>
          {volunteers.cards.map((volunteer) => (
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
      ) : <NoVolunteers courseCode={courseCode} />}
    </section>
  );
}

function NoVolunteers({ courseCode }: { courseCode: string }) {
  return <div className={styles.empty}><h2>No volunteers yet</h2><p>Nobody has offered to help with {courseCode} yet. You can still explore the course details above.</p></div>;
}
