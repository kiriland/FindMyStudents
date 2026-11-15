"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { courseHref, discoveryHref, PAGE_SIZE, queryString, readCourseQuery } from "../course-model";
import type { CoursePage, CourseQuery } from "../course-model";
import styles from "../discovery.module.css";

function navigate(query: CourseQuery, replace = false) {
  const href = discoveryHref(query);
  if (replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
}

export default function ClassSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [result, setResult] = useState<CoursePage | null>(null);
  const query = pathname === "/dashboard" ? readCourseQuery(params) : result?.query ?? readCourseQuery(params);
  const key = queryString(query);
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
    // An intercepted course URL must not overwrite the background search.
    if (pathname === "/dashboard") setSearch(readCourseQuery(new URLSearchParams(key)).search);
  }, [key, pathname]);

  useEffect(() => {
    if (pathname !== "/dashboard" || search.trim() === query.search) return;
    const timeout = window.setTimeout(() => navigate({ search: search.trim(), department: query.department, page: 1 }, true), 300);
    return () => window.clearTimeout(timeout);
  }, [search, query.search, query.department, pathname]);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/courses${key ? `?${key}` : ""}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load courses.");
        const data: CoursePage = await response.json();
        if (controller.signal.aborted) return;
        setResult(data);
        setLoading(false);
        if (queryString(data.query) !== key) navigate(data.query, true);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError("Could not load courses. Please try again.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [key, pathname, retry]);

  const updating = loading || search.trim() !== query.search;
  const available = result && queryString(result.query) === key && !error;
  const first = result && result.total ? (result.query.page - 1) * PAGE_SIZE + 1 : 0;

  function clearFilters() {
    setSearch("");
    navigate({ search: "", department: "", page: 1 });
  }

  return (
    <>
      <section className={styles.searchPanel} aria-label="Course search">
        <div className={styles.searchField}>
          <label htmlFor="course-search">Search courses</label>
          <input id="course-search" type="search" maxLength={300} value={search}
            onChange={(event) => setSearch(event.target.value)} placeholder="Course code, title, or keyword" />
        </div>
        <div className={styles.departmentField}>
          <label htmlFor="department">Department</label>
          <select id="department" value={query.department} onChange={(event) => navigate({ search: search.trim(), department: event.target.value, page: 1 })}>
            <option value="">All departments</option>
            {query.department && !result?.departments.includes(query.department) && <option value={query.department}>{query.department}</option>}
            {result?.departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </div>
        {(search || query.department) && <button className={styles.textButton} onClick={clearFilters} type="button">Clear filters</button>}
      </section>

      <div className={styles.resultHeader} role="status" aria-live="polite">
        <p>{loading ? "Finding courses…" : error ? "Courses unavailable" : result ? `${result.total.toLocaleString()} ${result.total === 1 ? "course" : "courses"} found` : "Browse courses"}</p>
        {available && result.total > 0 && <span>{first}–{Math.min(first + PAGE_SIZE - 1, result.total)} of {result.total.toLocaleString()}</span>}
      </div>

      {error ? (
        <div className={styles.empty} role="alert"><h2>Let’s try that again.</h2><p>{error}</p><button className={styles.button} type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>
      ) : !available ? (
        <div className={styles.skeleton} aria-label="Loading courses" aria-busy="true"><div /><div /><div /></div>
      ) : result.total === 0 ? (
        <div className={styles.empty}><h2>{result.catalogueTotal === 0 ? "No courses yet" : "No courses found"}</h2><p>{result.catalogueTotal === 0 ? "The catalogue is empty. Please check back soon." : "Try a different keyword or clear your filters."}</p>{result.catalogueTotal > 0 && <button className={styles.button} type="button" onClick={clearFilters}>Clear filters</button>}</div>
      ) : (
        <ul className={styles.results} aria-busy={loading}>
          {result.courses.map((course) => (
            <li key={course.courseCode}>
              <Link href={courseHref(course)} prefetch={false} scroll={false} className={styles.courseRow}>
                <span className={styles.courseCode}>{course.courseCode}</span>
                <div><h2>{course.title}</h2><p>{course.preview || "Open this course to learn more."}</p></div>
                <span className={styles.rowAction} aria-hidden="true">View course ↗</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {available && result.total > 0 && (
        <nav className={styles.pagination} aria-label="Course results pages">
          <button className={styles.button} type="button" disabled={updating || result.query.page === 1} onClick={() => { navigate({ ...result.query, page: result.query.page - 1 }); window.scrollTo(0, 0); }}>Previous</button>
          <span>Page {result.query.page} of {result.pageCount}</span>
          <button className={styles.button} type="button" disabled={updating || result.query.page === result.pageCount} onClick={() => { navigate({ ...result.query, page: result.query.page + 1 }); window.scrollTo(0, 0); }}>Next</button>
        </nav>
      )}
    </>
  );
}
