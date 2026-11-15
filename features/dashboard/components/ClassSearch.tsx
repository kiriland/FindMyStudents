"use client";

import { Suspense, use, useState } from "react";
import type { Course } from "@/features/dashboard/classes-service";

export default function ClassSearch({ classesPromise }: { classesPromise: Promise<Course[] | null> }) {
  return (
    <Suspense fallback={<p role="status">Loading classes...</p>}>
      <ClassResults classesPromise={classesPromise} />
    </Suspense>
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
    const title = normalizeSearch(course.title || course.courseCode);
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

function ClassResults({ classesPromise }: { classesPromise: Promise<Course[] | null> }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const classes = use(classesPromise);

  if (classes === null) {
    return <p role="alert">Could not load classes. Try refreshing the page.</p>;
  }

  if (classes.length === 0) {
    return <p>No classes have been added yet.</p>;
  }

  const departments = [...new Set(classes.map((course) => getDepartment(course.courseCode)))].filter(Boolean).sort();
  const filteredClasses = searchCourses(classes, search, department);

  function clearFilters() {
    setSearch("");
    setDepartment("");
  }

  return (
    <>
      <div className="mb-8 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700">
        <label htmlFor="class-search" className="block text-xl font-semibold">Find a Class</label>
        <input
          id="class-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Course code, number, name or keyword"
          className="mt-4 w-full rounded-lg border border-zinc-300 p-3 dark:border-zinc-700"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="department" className="block font-semibold">Department</label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">All departments</option>
              {departments.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {(search || department) && <button type="button" onClick={clearFilters} className="px-3 py-2 underline underline-offset-4">Clear filters</button>}
        </div>
      </div>
      <p role="status" className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">{filteredClasses.length} {filteredClasses.length === 1 ? "course" : "courses"} found</p>
      {filteredClasses.length === 0 ? (
        <p>No classes match your search and department. Try clearing the filters.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {filteredClasses.map((course) => (
            <li key={course.courseCode} className="rounded-lg border border-zinc-300 p-6 dark:border-zinc-700">
              <p className="text-sm font-semibold">{course.courseCode} · {course.credits == null ? "Credits not listed" : `${course.credits} credits`}</p>
              <h2 className="mt-2 text-xl font-semibold">{course.title || course.courseCode}</h2>
              <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">{course.description}</p>
              <a className="mt-5 inline-block underline underline-offset-4" href={course.sourceUrl}>
                Baruch catalog
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
