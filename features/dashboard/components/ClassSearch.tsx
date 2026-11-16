"use client";

import Button from "@/components/Button";
import { FieldLabel, Input, Select } from "@/components/ui/FormControls";
import { CourseResults, CourseResultsLoading } from "./CourseResults";
import EmptyState from "@/components/ui/EmptyState";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  discoveryHref,
  PAGE_SIZE,
  queryString,
  readCourseQuery,
} from "../course-model";
import type { CoursePage, CourseQuery } from "../course-model";

function navigate(query: CourseQuery, replace = false) {
  const href = discoveryHref(query);
  if (replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
}

export default function ClassSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [pages, setPages] = useState<Map<string, CoursePage>>(() => new Map());
  const [departments, setDepartments] = useState<string[]>([]);
  // Course links carry the originating query, including when reached via Back.
  const query = readCourseQuery(params);
  const key = queryString(query);
  const result = pages.get(key) ?? null;
  const [search, setSearch] = useState(query.search);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (pathname === "/dashboard" && params.toString() !== key) {
      window.history.replaceState(
        null,
        "",
        discoveryHref(readCourseQuery(params)),
      );
    }
  }, [pathname, params, key]);

  useEffect(() => {
    setSearch(readCourseQuery(new URLSearchParams(key)).search);
  }, [key]);

  useEffect(() => {
    if (pathname !== "/dashboard" || search.trim() === query.search) return;
    const timeout = window.setTimeout(
      () =>
        navigate(
          { search: search.trim(), department: query.department, page: 1 },
          true,
        ),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [search, query.search, query.department, pathname]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/courses${key ? `?${key}` : ""}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load courses.");
        const data: CoursePage = await response.json();
        if (controller.signal.aborted) return;
        setDepartments(data.departments);
        setPages((previous) => {
          const next = new Map(previous);
          const resultKey = queryString(data.query);
          next.delete(resultKey);
          next.set(resultKey, data);
          // Preserve nearby history entries without accumulating the catalogue.
          const oldest = next.keys().next().value;
          if (next.size > 5 && oldest !== undefined) next.delete(oldest);
          return next;
        });
        setLoading(false);
        const normalized = queryString(data.query);
        if (normalized !== key) {
          const currentPath = window.location.pathname;
          if (currentPath === "/dashboard") navigate(data.query, true);
          else
            window.history.replaceState(
              null,
              "",
              `${currentPath}${normalized ? `?${normalized}` : ""}`,
            );
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError("Could not load courses. Please try again.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [key, retry]);

  const updating = loading || search.trim() !== query.search;
  const available = result && queryString(result.query) === key && !error;
  const first =
    result && result.total ? (result.query.page - 1) * PAGE_SIZE + 1 : 0;

  function clearFilters() {
    setSearch("");
    navigate({ search: "", department: "", page: 1 });
  }

  return (
    <>
      <section
        className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5.5 dark:border-[#303036] dark:bg-zinc-900 max-[640px]:gap-3.5 max-[640px]:p-4"
        aria-label="Course search"
      >
        <div className="flex-[1_1_280px]">
          <FieldLabel htmlFor="course-search">Search courses</FieldLabel>
          <Input
            id="course-search"
            type="search"
            maxLength={300}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Course code, title, or keyword"
          />
        </div>
        <div className="flex-[0_1_190px] max-[640px]:flex-[1_1_100%]">
          <FieldLabel htmlFor="department">Department</FieldLabel>
          <Select
            id="department"
            value={query.department}
            onChange={(event) =>
              navigate({
                search: search.trim(),
                department: event.target.value,
                page: 1,
              })
            }
          >
            <option value="">All departments</option>
            {query.department && !departments.includes(query.department) && (
              <option value={query.department}>{query.department}</option>
            )}
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </div>
        {(search || query.department) && (
          <Button
            variant="text"
            className="py-3"
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </Button>
        )}
      </section>

      <div
        className="mx-0.5 mt-7 mb-3 flex justify-between gap-3 text-[13px] text-zinc-500 dark:text-zinc-400 [&_p]:font-semibold"
        role="status"
        aria-live="polite"
      >
        <p>
          {loading
            ? "Finding courses…"
            : error
              ? "Courses unavailable"
              : result
                ? `${result.total.toLocaleString()} ${result.total === 1 ? "course" : "courses"} found`
                : "Browse courses"}
        </p>
        {available && result.total > 0 && (
          <span>
            {first}–{Math.min(first + PAGE_SIZE - 1, result.total)} of{" "}
            {result.total.toLocaleString()}
          </span>
        )}
      </div>

      {error ? (
        <EmptyState
          role="alert"
          title="Let’s try that again."
          description={error}
        >
          <Button type="button" onClick={() => setRetry((value) => value + 1)}>
            Try again
          </Button>
        </EmptyState>
      ) : !available ? (
        <CourseResultsLoading />
      ) : result.total === 0 ? (
        <EmptyState
          title={
            result.catalogueTotal === 0 ? "No courses yet" : "No courses found"
          }
          description={
            result.catalogueTotal === 0
              ? "The catalogue is empty. Please check back soon."
              : "Try a different keyword or clear your filters."
          }
        >
          {result.catalogueTotal > 0 && (
            <Button type="button" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </EmptyState>
      ) : (
        <CourseResults courses={result.courses} query={key} loading={loading} />
      )}

      {available && result.total > 0 && (
        <nav
          className="flex items-center justify-between gap-3 pt-6 [&>span]:text-[13px] [&>span]:text-zinc-500 dark:[&>span]:text-zinc-400"
          aria-label="Course results pages"
        >
          <Button
            type="button"
            disabled={updating || result.query.page === 1}
            onClick={() => {
              navigate({ ...result.query, page: result.query.page - 1 });
              window.scrollTo(0, 0);
            }}
          >
            Previous
          </Button>
          <span>
            Page {result.query.page} of {result.pageCount}
          </span>
          <Button
            type="button"
            disabled={updating || result.query.page === result.pageCount}
            onClick={() => {
              navigate({ ...result.query, page: result.query.page + 1 });
              window.scrollTo(0, 0);
            }}
          >
            Next
          </Button>
        </nav>
      )}
    </>
  );
}
