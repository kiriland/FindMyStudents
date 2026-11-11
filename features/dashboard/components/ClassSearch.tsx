"use client";

import { Suspense, use, useState } from "react";
import type { Course } from "@/features/dashboard/classes-service";

export default function ClassSearch({ classesPromise }: { classesPromise: Promise<Course[] | null> }) {
  const [search, setSearch] = useState("");

  return (
    <>
      <div className="mb-8 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700">
        <label htmlFor="class-search" className="block text-xl font-semibold">
          Find a Class
        </label>
        <input
          id="class-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course code or class name..."
          className="mt-4 w-full rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
        />
      </div>
      <Suspense fallback={<p role="status">Loading classes...</p>}>
        <ClassResults classesPromise={classesPromise} search={search} />
      </Suspense>
    </>
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

function ClassResults({ classesPromise, search }: {
  classesPromise: Promise<Course[] | null>;
  search: string;
}) {
  const classes = use(classesPromise);

  if (classes === null) {
    return <p role="alert">Could not load classes. Try refreshing the page.</p>;
  }

  if (classes.length === 0) {
    return <p>No classes have been added yet.</p>;
  }

  const filteredClasses = searchCourses(classes, search, "");

  return (
      filteredClasses.length === 0 ? (
        <p>No classes match your search.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {filteredClasses.map((course) => (
            <li key={course.courseCode} className="rounded-lg border border-zinc-300 p-6 dark:border-zinc-700">
              <p className="text-sm font-semibold">{course.courseCode} · {course.credits} credits</p>
              <h2 className="mt-2 text-xl font-semibold">{course.title}</h2>
              <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">{course.description}</p>
              <a className="mt-5 inline-block underline underline-offset-4" href={course.sourceUrl}>
                Baruch catalog
              </a>
            </li>
          ))}
        </ul>
      )
  );
}
