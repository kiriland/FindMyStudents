import Link from "next/link";

import { buttonClass } from "@/components/ui/button";

import { COURSE_HEADING_ID, discoveryHref } from "../course-model";

/** A placeholder in the shape of the course details while they load. */
export function CourseLoading() {
  return (
    <div
      role="status"
      aria-label="Loading course details"
      className="flex flex-col gap-4"
    >
      <span className="h-4 w-40 rounded-md bg-well" />
      <span className="shimmer mt-3 h-11 w-48 rounded-lg bg-well" />
      <span className="h-7 w-3/4 rounded-lg bg-well" />
      <span className="mt-2 h-4 w-full rounded-md bg-well" />
      <span className="h-4 w-11/12 rounded-md bg-well" />
      <span className="h-4 w-2/3 rounded-md bg-well" />
    </div>
  );
}

export function CourseNotFound() {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <h1 id={COURSE_HEADING_ID} className="font-display text-xl font-semibold">
        Course not found
      </h1>
      <p className="mx-auto mt-2 mb-5 max-w-[44ch] text-muted">
        This course isn’t in the current catalogue.
      </p>
      <Link
        className={buttonClass({ variant: "secondary" })}
        href={discoveryHref()}
      >
        Browse courses
      </Link>
    </div>
  );
}
