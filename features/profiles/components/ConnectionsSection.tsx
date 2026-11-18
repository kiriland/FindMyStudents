import Link from "next/link";
import { courseHref } from "@/features/courses/course-model";
import type { ConnectionsOverview, RelatedStudent } from "../connection-model";
import Avatar from "./Avatar";
import RequestActions from "./RequestActions";
import styles from "../profile.module.css";

/** The owner's private Connections section. Only ever rendered for the owner. */
export default function ConnectionsSection({ overview }: { overview: ConnectionsOverview }) {
  const { incoming, sent } = overview;
  return (
    <section className={styles.section} aria-labelledby="profile-connections">
      <div className={styles.sectionHeader}>
        <h2 id="profile-connections">Connections</h2>
        <span className={styles.private}>Only visible to you</span>
      </div>
      {!incoming.length && !sent.length && <p className={styles.status}>No connections yet.</p>}
      {incoming.length > 0 && (
        <div className={styles.group}>
          <h3>Requests for you</h3>
          <ul className={styles.requests}>
            {incoming.map((request) => (
              <li key={request.requestId} className={styles.request}>
                <Student student={request.student} courseCode={request.courseCode} />
                {request.message && <p className={styles.requestMessage}>{request.message}</p>}
                <RequestActions studentId={request.student.id} requestId={request.requestId} kind="incoming" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {sent.length > 0 && (
        <div className={styles.group}>
          <h3>Sent</h3>
          <ul className={styles.requests}>
            {sent.map((request) => (
              <li key={request.student.id} className={styles.request}>
                <Student student={request.student} courseCode={request.courseCode} />
                {request.status === "pending"
                  ? <RequestActions studentId={request.student.id} requestId={request.requestId} kind="outgoing" />
                  : <p className={styles.status}>Declined · can ask again on {request.until.slice(0, 10)} (UTC).</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Student({ student, courseCode }: { student: RelatedStudent; courseCode: string }) {
  return (
    <div className={styles.requestStudent}>
      <Avatar size="small" initials={student.initials} pictureUrl={student.pictureUrl} />
      <span>
        <Link href={student.href} className={styles.volunteerName}>{student.displayName}</Link>
        <Link href={courseHref({ courseCode })} className={styles.hint}>{courseCode}</Link>
      </span>
    </div>
  );
}
