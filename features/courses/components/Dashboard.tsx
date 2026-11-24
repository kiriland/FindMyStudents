import { Suspense } from "react";

import { CourseCardSkeleton } from "./CourseCard";
import CourseSearch from "./CourseSearch";

function SearchLoading() {
  return (
    <div
      className="wrap pt-3.5 pb-[88px]"
      role="status"
      aria-label="Loading course directory"
    >
      <div className="h-14 rounded-2xl border-[1.5px] border-line-strong bg-surface sm:h-16" />
      <div className="mt-[62px] grid gap-3.5 min-[900px]:ml-[272px] md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <CourseCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <main id="main" className="w-full flex-1">
      <div className="wrap pt-[clamp(24px,3.4vw,40px)] pb-1">
        <h1 className="font-display text-[clamp(34px,4.4vw,52px)] leading-[1.05] font-semibold tracking-[-0.04em]">
          Courses
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-lg text-muted">
          Search the Baruch catalogue, then open a course to see who offers
          help.
        </p>
      </div>
      <section
        id="explore-classes"
        aria-label="Explore Baruch courses"
        className="scroll-mt-[68px]"
      >
        <Suspense fallback={<SearchLoading />}>
          <CourseSearch />
        </Suspense>
      </section>
    </main>
  );
}
