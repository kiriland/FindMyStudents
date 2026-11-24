import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { LINK_CLASS } from "@/components/ui/button";
import { ChevronIcon } from "@/components/ui/icons";
import { discoveryHref, EMPTY_QUERY } from "@/features/courses/course-model";

import { getDepartmentIndex } from "../departments";
import { H2, LEDE } from "../styles";

const CODE =
  "relative inline-block rounded-sm pt-0.5 pb-1.5 font-display leading-[1.1] font-medium tracking-[-0.025em] text-subtle transition-[color,scale] duration-150 ease-soft after:absolute after:inset-x-0 after:bottom-0.5 after:h-[3px] after:origin-left after:scale-x-0 after:rounded-xs after:bg-brand after:transition-transform after:duration-250 after:ease-soft after:content-[''] hover:text-brand-strong hover:after:scale-x-100 focus-visible:text-brand-strong focus-visible:after:scale-x-100 active:scale-96";

function DepartmentLinks({ codes, size }: { codes: string[]; size: string }) {
  return (
    <ul className="flex flex-wrap gap-x-[clamp(16px,2vw,26px)] gap-y-1">
      {codes.map((department) => (
        <li key={department}>
          <Link
            href={discoveryHref({ ...EMPTY_QUERY, department })}
            className={`${CODE} ${size}`}
            aria-label={`${department} courses`}
          >
            {department}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The catalogue's departments, read at request time like the course directory. */
async function DepartmentIndex() {
  await connection();
  const index = await getDepartmentIndex();
  if (!index) {
    return (
      <p className="mt-7 text-[17px] text-muted">
        Departments can’t be shown right now.{" "}
        <Link href={discoveryHref()} className={LINK_CLASS}>
          Search all courses
        </Link>{" "}
        instead.
      </p>
    );
  }
  const total = index.featured.length + index.rest.length;
  return (
    <>
      <div className="mt-7">
        <DepartmentLinks
          codes={index.featured}
          size="text-[clamp(22px,2.9vw,36px)]"
        />
      </div>
      {index.rest.length > 0 && (
        <details className="group mt-[22px] details-smooth">
          <summary
            className={`${LINK_CLASS} inline-flex items-center gap-2 text-[15px]`}
          >
            <span className="group-open:hidden">
              Show all {total} departments
            </span>
            <span className="hidden group-open:inline">
              Show fewer departments
            </span>
            <ChevronIcon className="size-4 transition-transform duration-250 ease-soft group-open:rotate-180" />
          </summary>
          <div className="pt-4">
            <DepartmentLinks
              codes={index.rest}
              size="text-[clamp(18px,2.2vw,26px)]"
            />
          </div>
        </details>
      )}
    </>
  );
}

function DepartmentsLoading() {
  return (
    <div
      role="status"
      className="mt-7 flex flex-wrap gap-x-[clamp(16px,2vw,26px)] gap-y-3"
      aria-label="Loading departments"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="h-[clamp(26px,3vw,38px)] w-[clamp(54px,6vw,78px)] animate-pulse rounded-md bg-well"
        />
      ))}
    </div>
  );
}

/** Department codes set large, as a typographic index into the course directory. */
export default function Departments() {
  return (
    <section
      id="departments"
      aria-labelledby="depts-title"
      className="border-y border-line bg-surface py-[clamp(56px,8vw,96px)]"
    >
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 reveal">
          <div>
            <h2 id="depts-title" className={H2}>
              Browse by department
            </h2>
            <p className={LEDE}>Jump straight to a subject’s courses.</p>
          </div>
          <Link href={discoveryHref()} className={LINK_CLASS}>
            Search all courses
          </Link>
        </div>
        <Suspense fallback={<DepartmentsLoading />}>
          <DepartmentIndex />
        </Suspense>
      </div>
    </section>
  );
}
