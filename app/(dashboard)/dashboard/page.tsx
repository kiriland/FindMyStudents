"use client";

import { useState } from "react";
import classes from "@/data/classes.json";

export default function DashboardPage() {
  const [search, setSearch] = useState("");

  const filteredClasses = classes.filter((course) => {
    const query = search.toLowerCase().trim();

    return (
      course.courseCode.toLowerCase().includes(query) ||
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-blue-900">
          Find My Students
        </h1>

        <p className="mt-3 text-lg text-gray-600">
          Search Baruch College classes to find study partners
          and connect with other students.
        </p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Find a Class
          </h2>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code or class name..."
            className="mt-4 w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">
            Available Classes
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            {filteredClasses.map((course) => (
              <div
                key={course.courseCode}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-blue-900">
                  {course.courseCode}
                </h3>

                <p className="mt-2 text-lg font-semibold">
                  {course.title}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {course.school} • {course.credits} Credits
                </p>

                <p className="mt-4 text-gray-600">
                  {course.description}
                </p>

                <a
                  href={course.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block font-semibold text-blue-800 underline"
                >
                  View Course Details
                </a>
              </div>
            ))}
          </div>

          {filteredClasses.length === 0 && (
            <p className="mt-4 text-gray-600">
              No classes found. Try another course code or name.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
