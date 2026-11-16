"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { courseHref, discoveryHref, PAGE_SIZE, queryString, readCourseQuery } from "../course-model";
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
      window.history.replaceState(null, "", discoveryHref(readCourseQuery(params)));
    }
  }, [pathname, params, key]);

  useEffect(() => {
    setSearch(readCourseQuery(new URLSearchParams(key)).search);
  }, [key]);

  useEffect(() => {
    if (pathname !== "/dashboard" || search.trim() === query.search) return;
    const timeout = window.setTimeout(() => navigate({ search: search.trim(), department: query.department, page: 1 }, true), 300);
    return () => window.clearTimeout(timeout);
  }, [search, query.search, query.department, pathname]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/courses${key ? `?${key}` : ""}`, { signal: controller.signal, cache: "no-store" })
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
          else window.history.replaceState(null, "", `${currentPath}${normalized ? `?${normalized}` : ""}`);
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
  const first = result && result.total ? (result.query.page - 1) * PAGE_SIZE + 1 : 0;

  function clearFilters() {
    setSearch("");
    navigate({ search: "", department: "", page: 1 });
  }

  return (
    <>
      <section className="flex flex-wrap items-end gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5.5 dark:border-[#303036] dark:bg-zinc-900 max-[640px]:gap-3.5 max-[640px]:p-4" aria-label="Course search">
        <div className="flex-[1_1_280px]">
          <label className="mb-2 block text-[13px] font-semibold" htmlFor="course-search">Search courses</label>
          <input className="min-h-[46px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950" id="course-search" type="search" maxLength={300} value={search}
            onChange={(event) => setSearch(event.target.value)} placeholder="Course code, title, or keyword" />
        </div>
        <div className="flex-[0_1_190px] max-[640px]:flex-[1_1_100%]">
          <label className="mb-2 block text-[13px] font-semibold" htmlFor="department">Department</label>
          <select className="min-h-[46px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950" id="department" value={query.department} onChange={(event) => navigate({ search: search.trim(), department: event.target.value, page: 1 })}>
            <option value="">All departments</option>
            {query.department && !departments.includes(query.department) && <option value={query.department}>{query.department}</option>}
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </div>
        {(search || query.department) && <button className="cursor-pointer py-3 text-[13px] underline underline-offset-4" onClick={clearFilters} type="button">Clear filters</button>}
      </section>

      <div className="mx-0.5 mt-7 mb-3 flex justify-between gap-3 text-[13px] text-zinc-500 dark:text-zinc-400 [&_p]:font-semibold" role="status" aria-live="polite">
        <p>{loading ? "Finding courses…" : error ? "Courses unavailable" : result ? `${result.total.toLocaleString()} ${result.total === 1 ? "course" : "courses"} found` : "Browse courses"}</p>
        {available && result.total > 0 && <span>{first}–{Math.min(first + PAGE_SIZE - 1, result.total)} of {result.total.toLocaleString()}</span>}
      </div>

      {error ? (
        <div className="rounded-[14px] border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-600 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:mb-5.5 [&_p]:leading-[1.6] [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400" role="alert"><h2>Let’s try that again.</h2><p>{error}</p><button className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-[9px] text-sm font-semibold text-inherit no-underline enabled:hover:bg-zinc-100 [&:is(a):hover]:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:enabled:hover:bg-zinc-800 dark:[&:is(a):hover]:bg-zinc-800" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>
      ) : !available ? (
        <div className="rounded-[14px] border border-zinc-200 dark:border-[#303036] px-6 [&>div]:h-[116px] [&>div+div]:border-t [&>div+div]:border-zinc-200 dark:[&>div+div]:border-[#303036] [&>div]:bg-[linear-gradient(#f4f4f5_0_0),linear-gradient(#f4f4f5_0_0)] dark:[&>div]:bg-[linear-gradient(#27272a_0_0),linear-gradient(#27272a_0_0)] [&>div]:bg-position-[0_25px,0_53px] [&>div]:bg-size-[35%_14px,90%_12px] [&>div]:bg-no-repeat" aria-label="Loading courses" aria-busy="true"><div /><div /><div /></div>
      ) : result.total === 0 ? (
        <div className="rounded-[14px] border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-600 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:mb-5.5 [&_p]:leading-[1.6] [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400"><h2>{result.catalogueTotal === 0 ? "No courses yet" : "No courses found"}</h2><p>{result.catalogueTotal === 0 ? "The catalogue is empty. Please check back soon." : "Try a different keyword or clear your filters."}</p>{result.catalogueTotal > 0 && <button className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-[9px] text-sm font-semibold text-inherit no-underline enabled:hover:bg-zinc-100 [&:is(a):hover]:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:enabled:hover:bg-zinc-800 dark:[&:is(a):hover]:bg-zinc-800" type="button" onClick={clearFilters}>Clear filters</button>}</div>
      ) : (
        <ul className="list-none overflow-hidden rounded-[14px] border border-zinc-200 dark:border-[#303036] p-0 [&>li+li]:border-t [&>li+li]:border-zinc-200 dark:[&>li+li]:border-[#303036]" aria-busy={loading}>
          {result.courses.map((course) => (
            <li key={course.courseCode}>
              <Link href={`${courseHref(course)}${key ? `?${key}` : ""}`} prefetch={false} scroll={false} className="grid grid-cols-[106px_1fr_auto] items-start gap-5 p-[23px] text-inherit no-underline transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-900 max-[640px]:grid-cols-1 max-[640px]:gap-2.5 max-[640px]:p-5 [&_h2]:text-base [&_h2]:font-[650] [&_h2]:leading-[1.4] [&_p]:mt-1.5 [&_p]:line-clamp-2 [&_p]:text-sm [&_p]:leading-[1.6] [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400">
                <span className="inline-block w-fit rounded-md bg-indigo-50 px-2 py-1.5 text-xs font-bold tracking-[.025em] whitespace-nowrap text-indigo-700 dark:bg-[#252348] dark:text-indigo-200">{course.courseCode}</span>
                <div><h2>{course.title}</h2><p>{course.preview || "Open this course to learn more."}</p></div>
                <span className="pt-1.25 text-xs whitespace-nowrap text-zinc-500 dark:text-zinc-400 max-[640px]:hidden" aria-hidden="true">View course ↗</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {available && result.total > 0 && (
        <nav className="flex items-center justify-between gap-3 pt-6 [&>span]:text-[13px] [&>span]:text-zinc-500 dark:[&>span]:text-zinc-400" aria-label="Course results pages">
          <button className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-[9px] text-sm font-semibold text-inherit no-underline enabled:hover:bg-zinc-100 [&:is(a):hover]:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:enabled:hover:bg-zinc-800 dark:[&:is(a):hover]:bg-zinc-800" type="button" disabled={updating || result.query.page === 1} onClick={() => { navigate({ ...result.query, page: result.query.page - 1 }); window.scrollTo(0, 0); }}>Previous</button>
          <span>Page {result.query.page} of {result.pageCount}</span>
          <button className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-[9px] text-sm font-semibold text-inherit no-underline enabled:hover:bg-zinc-100 [&:is(a):hover]:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:enabled:hover:bg-zinc-800 dark:[&:is(a):hover]:bg-zinc-800" type="button" disabled={updating || result.query.page === result.pageCount} onClick={() => { navigate({ ...result.query, page: result.query.page + 1 }); window.scrollTo(0, 0); }}>Next</button>
        </nav>
      )}
    </>
  );
}
