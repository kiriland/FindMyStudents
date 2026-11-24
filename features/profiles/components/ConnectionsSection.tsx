import Link from "next/link";

import CourseTag from "@/components/ui/CourseTag";
import { courseHref } from "@/features/courses/course-model";

import type { ConnectionsOverview, RelatedStudent } from "../connection-model";

import { cooldownDate } from "../connection-model";
import Avatar from "./Avatar";
import { ContactList } from "./ContactDetails";
import PrivateBadge from "./PrivateBadge";
import { REQUEST_MESSAGE, SECTION_TITLE } from "./profile-styles";
import RemoveConnection from "./RemoveConnection";
import RequestActions from "./RequestActions";

const GROUP_TITLE =
  "font-display text-base leading-[1.3] font-semibold text-ink-2";
const ITEM =
  "flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-3.5";

/** The owner's private Connections section. Only ever rendered for the owner. */
export default function ConnectionsSection({
  overview,
}: {
  overview: ConnectionsOverview;
}) {
  const { incoming, sent, connections } = overview;
  return (
    <section
      aria-labelledby="profile-connections"
      className="flex flex-col gap-[18px]"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 id="profile-connections" className={SECTION_TITLE}>
          Connections
        </h2>
        <PrivateBadge />
      </div>
      {incoming.length === 0 &&
        sent.length === 0 &&
        connections.length === 0 && (
          <p className="text-subtle">No connections yet.</p>
        )}
      {incoming.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className={GROUP_TITLE}>Requests for you</h3>
          <ul className="flex flex-col gap-2.5">
            {incoming.map((request) => (
              <li key={request.requestId} className={ITEM}>
                <Student
                  student={request.student}
                  courseCode={request.courseCode}
                />
                {request.message && (
                  <p className={REQUEST_MESSAGE}>{request.message}</p>
                )}
                <RequestActions
                  studentId={request.student.id}
                  requestId={request.requestId}
                  kind="incoming"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {sent.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className={GROUP_TITLE}>Sent</h3>
          <ul className="flex flex-col gap-2.5">
            {sent.map((request) => (
              <li key={request.student.id} className={ITEM}>
                <Student
                  student={request.student}
                  courseCode={request.courseCode}
                />
                {request.status === "pending" ? (
                  <RequestActions
                    studentId={request.student.id}
                    requestId={request.requestId}
                    kind="outgoing"
                  />
                ) : (
                  <p className="text-sm text-subtle">
                    Declined · can ask again on {cooldownDate(request.until)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {connections.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className={GROUP_TITLE}>Connections</h3>
          <ul className="flex flex-col gap-2.5">
            {connections.map((connection) => (
              <li key={connection.student.id} className={ITEM}>
                <Student
                  student={connection.student}
                  courseCode={connection.courseCode}
                />
                <ContactList
                  contacts={connection.contacts}
                  empty="No contact details yet."
                />
                <RemoveConnection
                  studentId={connection.student.id}
                  displayName={connection.student.displayName}
                  label="Remove"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Student({
  student,
  courseCode,
}: {
  student: RelatedStudent;
  courseCode: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        size="small"
        initials={student.initials}
        pictureUrl={student.pictureUrl}
      />
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <Link
          href={student.href}
          className="font-display leading-[1.3] font-semibold [overflow-wrap:anywhere] text-ink hover:text-brand-strong"
        >
          {student.displayName}
        </Link>
        <Link href={courseHref({ courseCode })} className="no-underline">
          <CourseTag code={courseCode} />
        </Link>
      </div>
    </div>
  );
}
