import Link from "next/link";
import { loginHref } from "@/features/auth/return-to";
import { courseHref } from "@/features/courses/course-model";
import { getCourseVolunteers, getProfile, getViewer } from "../profiles";
import { getRelationships } from "../connections";
import { profileHref } from "../profile-model";
import Avatar from "./Avatar";
import ConnectionControls from "./ConnectionControls";
import styles from "../profile.module.css";

/**
 * A Course's Volunteers: cards for signed-in students, only a count for
 * signed-out visitors. What a viewer may see is decided by the Profiles module.
 */
export default async function CourseVolunteers({ courseCode, title }: { courseCode: string; title: string }) {
  const viewer = await getViewer();
  const { count, cards } = await getCourseVolunteers(viewer, courseCode);
  // One batched read for every card, however many Volunteers there are.
  const relationships = viewer && cards?.length ? await getRelationships(viewer, cards.map((card) => card.id)) : null;
  const ownProfile = viewer && [...(relationships?.values() ?? [])].some((relationship) => relationship.status === "none")
    ? await getProfile(viewer, viewer.studentId) : null;
  const hasContacts = !!(ownProfile?.isOwner && Object.values(ownProfile.contacts).some(Boolean));
  const offer = { courseCode, title, href: courseHref({ courseCode }) };
  return (
    <section className={styles.volunteerSection} aria-labelledby="volunteers-heading">
      <h2 id="volunteers-heading" className={styles.volunteerHeading}>Students offering to help</h2>
      {!count || cards?.length === 0 ? (
        <div className={styles.empty}>
          <h2>No volunteers yet</h2>
          <p>Nobody has offered to help with {courseCode} yet. You can still explore the course details above.</p>
        </div>
      ) : !cards ? (
        <p className={styles.volunteerCount}>
          {count === 1 ? "1 student offers" : `${count} students offer`} help — <Link href={loginHref(courseHref({ courseCode }))}>sign in to see them</Link>
        </p>
      ) : (
        <>
          <ul className={styles.volunteers}>
            {cards.map((volunteer) => {
              const relationship = relationships?.get(volunteer.id);
              return (
                <li key={volunteer.id} className={styles.volunteerItem}>
                  <Link href={volunteer.href} prefetch={false} className={styles.volunteerCard}>
                    <Avatar size="small" initials={volunteer.initials} pictureUrl={volunteer.pictureUrl} />
                    <span>
                      <span className={styles.volunteerName}>{volunteer.displayName}</span>
                      {volunteer.bioExcerpt && <span className={styles.volunteerBio}>{volunteer.bioExcerpt}</span>}
                    </span>
                  </Link>
                  {viewer && relationship && relationship.status !== "self" && (
                    <ConnectionControls studentId={volunteer.id} displayName={volunteer.displayName} relationship={relationship} offers={[offer]} ownProfileHref={profileHref(viewer.studentId)} hasContacts={hasContacts} cardProfileHref={volunteer.href} />
                  )}
                </li>
              );
            })}
          </ul>
          {count > cards.length && <p className={styles.hint}>Showing the newest {cards.length} of {count} volunteers.</p>}
        </>
      )}
    </section>
  );
}
