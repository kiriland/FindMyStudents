import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import CourseTag from "@/components/ui/CourseTag";
import { discoveryHref } from "@/features/courses/course-model";

import AccountCta from "./AccountCta";

const KICKER =
  "font-display text-[15px] leading-none font-medium text-brand-strong";
const TITLE =
  "font-display text-[clamp(28px,3.2vw,42px)] leading-[1.08] font-semibold tracking-[-0.035em]";
const TEXT = "max-w-[38ch] text-lg leading-relaxed text-muted";

/** The two reasons to come: getting help, and offering it. */
export default function Roles() {
  return (
    <section
      aria-label="Get help or offer help"
      className="pb-[clamp(64px,9vw,112px)]"
    >
      <div className="wrap">
        <div className="grid overflow-hidden rounded-panel border border-line bg-surface reveal md:grid-cols-2">
          <div className="flex flex-col items-start gap-3.5 p-[clamp(28px,4.4vw,56px)]">
            <span className={KICKER}>Need help?</span>
            <h3 className={TITLE}>Stuck on a course this semester?</h3>
            <p className={TEXT}>
              Search for it and see who has offered to help. Browsing is open to
              everyone.
            </p>
            <ul className="mt-1 mb-2.5 flex flex-col gap-2 text-ink-2">
              {[
                "Search by code, title or topic",
                "See who offers help with each course",
                "Read their profile before you reach out",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-baseline gap-2.5 before:size-1.5 before:flex-none before:-translate-y-0.5 before:rounded-full before:bg-brand before:content-['']"
                >
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={discoveryHref()}
              className={buttonClass({ className: "mt-auto" })}
            >
              Browse courses
            </Link>
          </div>
          <div className="flex flex-col items-start gap-3.5 border-t border-brand-100 bg-brand-50 p-[clamp(28px,4.4vw,56px)] md:border-t-0 md:border-l">
            <span className={KICKER}>Want to help?</span>
            <h3 className={TITLE}>Know a course well? Pass it on.</h3>
            <p className={TEXT}>
              Add it to your Help Offers and you’ll appear on that course’s
              page, where students looking for help can find you.
            </p>
            <div
              aria-hidden="true"
              className="mt-0.5 mb-2.5 flex flex-wrap gap-2"
            >
              <CourseTag code="CIS 3400" tone="outline" />
              <CourseTag code="MTH 2003" tone="outline" />
              <span className="inline-flex items-center rounded-tag border border-dashed border-brand-200 px-[9px] py-[5px] font-display text-sm leading-none font-medium text-brand-strong">
                + Add a course
              </span>
            </div>
            <AccountCta
              signedInLabel="Add your Help Offers"
              variant="secondary"
              className="mt-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
