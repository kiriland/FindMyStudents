import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { ArrowIcon } from "@/components/ui/icons";
import { loginHref } from "@/features/auth/return-to";
import { courseHref } from "@/features/courses/course-model";
import { getCourseVolunteers, getProfile, getViewer } from "../profiles";
import { getRelationships } from "../connections";
import { profileHref } from "../profile-model";
import Avatar from "./Avatar";
import ConnectionControls from "./ConnectionControls";

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
    <section className="mt-8 border-t border-line pt-7" aria-labelledby="volunteers-heading">
      <div className="mb-4 flex items-center gap-2.5">
        <h2 id="volunteers-heading" className="font-display text-[19px] leading-[1.3] font-semibold tracking-[-0.015em]">
          Students offering help
        </h2>
        <span className="rounded-full bg-well px-[9px] py-[3px] font-display text-[13px] leading-[1.2] font-semibold text-muted tabular-nums">
          {count}
          <span className="sr-only">{count === 1 ? " student" : " students"}</span>
        </span>
      </div>
      {!count || cards?.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <h3 className="font-display text-lg font-semibold">No one offers help yet</h3>
          <p className="mx-auto mt-2 mb-5 max-w-[44ch] text-muted">
            If you know {courseCode} well, add it to your Help Offers so classmates can find you.
          </p>
          {viewer ? (
            <Link href={profileHref(viewer.studentId)} className={buttonClass({ variant: "secondary" })}>Add your Help Offers</Link>
          ) : (
            <Link href="/signup" className={buttonClass({ variant: "secondary" })}>Create an account to offer help</Link>
          )}
        </div>
      ) : !cards ? (
        <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-xl border border-line bg-canvas p-[18px]">
          <p className="text-ink-2">
            <strong className="font-display font-semibold">{count === 1 ? "1 student offers" : `${count} students offer`}</strong> help with {courseCode}.
          </p>
          <Link href={loginHref(courseHref({ courseCode }))} className={buttonClass({ size: "sm" })}>Log in to see them</Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {cards.map((volunteer) => {
              const relationship = relationships?.get(volunteer.id);
              return (
              <li key={volunteer.id} className="overflow-hidden rounded-xl border border-line bg-surface transition-colors duration-150 hover:border-brand-200">
                <Link
                  href={volunteer.href}
                  prefetch={false}
                  className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-[#f8fbff] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <Avatar size="small" initials={volunteer.initials} pictureUrl={volunteer.pictureUrl} />
                  <span>
                    <span className="block font-display leading-[1.3] font-semibold">{volunteer.displayName}</span>
                    {volunteer.bioExcerpt && (
                      <span className="mt-0.5 line-clamp-2 text-[15px] leading-[1.45] [overflow-wrap:anywhere] text-muted">{volunteer.bioExcerpt}</span>
                    )}
                  </span>
                  <ArrowIcon className="hidden size-[18px] text-brand-strong transition-transform duration-250 ease-soft group-hover:translate-x-[3px] sm:block" />
                </Link>
                {viewer && relationship && relationship.status !== "self" && (
                  <ConnectionControls studentId={volunteer.id} displayName={volunteer.displayName} relationship={relationship} offers={[offer]} ownProfileHref={profileHref(viewer.studentId)} hasContacts={hasContacts} cardProfileHref={volunteer.href} />
                )}
              </li>
              );
            })}
          </ul>
          {count > cards.length && <p className="mt-3 text-sm text-subtle">Showing the newest {cards.length} of {count} volunteers.</p>}
        </>
      )}
    </section>
  );
}
