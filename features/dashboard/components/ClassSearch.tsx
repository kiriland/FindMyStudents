
"use client";

import { Suspense, use, useState } from "react";
import Input from "@/components/Input";
import type { Course } from "@/features/dashboard/classes-service";

export default function ClassSearch({
  classesPromise,
}: {
  classesPromise: Promise<Course[] | null>;
}) {
  const [search, setSearch] = useState("");

  return (
    <div className="w-full">
      {/* SEARCH PANEL */}
      <div className="mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5 sm:p-8">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              Search Courses
            </p>

            <label
              htmlFor="class-search"
              className="block text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
            >
              What class are you looking for?
            </label>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Search by course code, class title, or keyword.
            </p>
          </div>

          <div className="relative">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-zinc-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-4-4" />
            </svg>

            <Input
              id="class-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try CIS 4160, Marketing, Finance..."
              className="w-full rounded-xl border border-zinc-300 bg-white py-4 pl-12 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-base"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Results update automatically as you type.
            </p>

            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-blue-50/60 px-5 py-4 sm:px-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17v-5m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
              />
            </svg>
          </span>

          <p className="text-xs leading-6 text-blue-800 sm:text-sm">
            Tip: You can search using a course code like{" "}
            <strong>CIS 4160</strong> or a keyword like{" "}
            <strong>Finance</strong>.
          </p>
        </div>
      </div>

      {/* AWS-POWERED COURSE RESULTS */}
      <Suspense fallback={<LoadingState />}>
        <ClassResults
          classesPromise={classesPromise}
          search={search}
        />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <p className="text-sm font-medium text-zinc-600">
        Loading available classes...
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6"
          >
            <div className="mb-6 h-7 w-24 rounded-lg bg-zinc-100" />
            <div className="mb-4 h-6 w-3/4 rounded bg-zinc-100" />
            <div className="mb-2 h-4 w-full rounded bg-zinc-100" />
            <div className="mb-2 h-4 w-5/6 rounded bg-zinc-100" />
            <div className="mt-8 h-4 w-32 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getDepartment(courseCode: string) {
  return courseCode.trim().match(/^[a-z]+/i)?.[0].toUpperCase() ?? "";
}

function normalizeSearch(text: string) {
  return text.toLowerCase().replace(/([a-z])(\d)/g, "$1 $2").replace(/[^a-z0-9]+/g, " ").trim();
}

function searchCourses(classes: Course[], search: string, department: string) {
  const query = normalizeSearch(search);
  const words = query.split(/\s+/).filter(Boolean);
  const departments = new Set(classes.map((course) => getDepartment(course.courseCode).toLowerCase()));

  if (!query && search.trim()) return [];

  return classes.map((course) => {
    const code = normalizeSearch(course.courseCode);
    const number = code.match(/\d+/)?.[0] ?? "";
    const subject = getDepartment(course.courseCode);
    const title = normalizeSearch(course.title);
    const description = normalizeSearch(course.description);

    if (department && subject !== department) return null;
    const matches = words.every((word) => {
      if (/^\d+$/.test(word)) return number.startsWith(word);
      if (departments.has(word)) return subject.toLowerCase() === word;
      return code.includes(word) || title.includes(word) || description.includes(word);
    });
    if (!matches) return null;

    let rank = 5;
    if (!query || code.replace(/ /g, "") === query.replace(/ /g, "")) rank = 0;
    else if (number === query) rank = 1;
    else if (words.every((word) => code.includes(word))) rank = 2;
    else if (title.includes(query)) rank = 3;
    else if (words.every((word) => title.includes(word))) rank = 4;

    return { course, rank };
  }).filter((result) => result !== null)
    .sort((a, b) => a.rank - b.rank || a.course.courseCode.localeCompare(b.course.courseCode, undefined, { numeric: true }))
    .map((result) => result.course);
}

function ClassResults({
  classesPromise,
  search,
}: {
  classesPromise: Promise<Course[] | null>;
  search: string;
}) {
  const [department, setDepartment] = useState("");
  const classes = use(classesPromise);

  if (classes === null) {
    return (
      <div
        role="alert"
        className="rounded-3xl border border-amber-200 bg-white px-5 py-12 text-center shadow-sm sm:px-8"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-zinc-900">
          Classes are temporarily unavailable
        </h3>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-600">
          We couldn&apos;t load the course directory right now.
          Please try again later.
        </p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-12 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-zinc-900">
          No classes available yet
        </h3>

        <p className="mt-3 text-sm text-zinc-600">
          Courses will appear here when they become available.
        </p>
      </div>
    );
  }

  const query = search.trim();
  const departments = [...new Set(classes.map((course) => getDepartment(course.courseCode)))].filter(Boolean).sort();
  const filteredClasses = searchCourses(classes, search, department);

  return (
    <section aria-label="Available courses">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="department" className="block text-sm font-semibold text-zinc-800">Department</label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-zinc-900"
          >
            <option value="">All departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        {department && (
          <button type="button" onClick={() => setDepartment("")} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            Clear department
          </button>
        )}
      </div>
      {/* RESULTS HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            Available Classes
          </h2>

          <p className="mt-2 text-sm text-zinc-600">
            {query
              ? `Showing results for "${search.trim()}"`
              : "Explore the available Baruch College courses."}
          </p>
        </div>

        <span
          aria-live="polite"
          className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
        >
          {filteredClasses.length}{" "}
          {filteredClasses.length === 1 ? "Class" : "Classes"} Found
        </span>
      </div>

      {/* NO MATCHING RESULTS */}
      {filteredClasses.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-12 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-4-4" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-zinc-900">
            No matching classes
          </h3>

          <p className="mt-3 text-sm leading-7 text-zinc-600">
            Try a different course code, class name, or keyword.
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {filteredClasses.map((course) => (
            <li
              key={`${course.school}-${course.courseCode}`}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/40 sm:p-7"
            >
              {/* COURSE BADGES */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex max-w-full items-center break-all rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold tracking-wide text-blue-700">
                  {course.courseCode}
                </span>

                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                  {course.credits} Credits
                </span>
              </div>

              {/* COURSE INFORMATION */}
              <div className="flex-1">
                <h3 className="break-words text-lg font-bold leading-7 text-zinc-900 transition group-hover:text-blue-700 sm:text-xl">
                  {course.title}
                </h3>

                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {course.school}
                </p>

                <p className="mt-5 whitespace-pre-line break-words text-sm leading-7 text-zinc-600 sm:text-base">
                  {course.description}
                </p>
              </div>

              {/* COURSE FOOTER */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
                <span className="text-xs font-medium text-zinc-400">
                  Course Information
                </span>

                <a
                  href={course.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  View Catalog
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
