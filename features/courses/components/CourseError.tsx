"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { COURSE_HEADING_ID, discoveryHref } from "../course-model";

export default function CourseError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <h1 id={COURSE_HEADING_ID} className="font-display text-xl font-semibold">Couldn’t load this course</h1>
      <p className="mx-auto mt-2 mb-5 max-w-[44ch] text-muted">Please try again in a moment.</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button className={buttonClass()} type="button" onClick={retry}>Try again</button>
        <Link className={buttonClass({ variant: "secondary" })} href={discoveryHref()}>Browse courses</Link>
      </div>
    </div>
  );
}
