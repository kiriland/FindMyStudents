"use client";

import { Suspense, use, useState } from "react";
import Input from "@/components/Input";
import type { Course } from "@/features/dashboard/classes-service";

export default function ClassSearch({ classesPromise }: { classesPromise: Promise<Course[] | null> }) {
  const [search, setSearch] = useState("");

  return (
    <>
      <div className="mb-8 rounded-xl border border-zinc-300 dark:border-zinc-700 p-6">
        <label htmlFor="class-search" className="block text-xl font-semibold">
          Find a Class
        </label>
        <Input
          id="class-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course code or class name..."
          className="mt-4"
        />
      </div>
      <Suspense fallback={<p role="status">Loading classes...</p>}>
        <ClassResults classesPromise={classesPromise} search={search} />
      </Suspense>
    </>
  );
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

  const filteredClasses = classes.filter((course) => {
    const query = search.toLowerCase().trim();

    return (
      course.courseCode.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query)
    );
  });

  return (
      filteredClasses.length === 0 ? (
        <p>No classes match your search.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {filteredClasses.map((course) => (
            <li key={course.courseCode} className="rounded-xl border border-zinc-300 dark:border-zinc-700 p-6">
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
