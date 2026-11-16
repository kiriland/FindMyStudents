"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { courseHref, discoveryHref, DISCOVERY_PATH, EMPTY_QUERY, PAGE_SIZE, queryString, readCourseQuery, withQuery } from "../course-model";
import type { CourseQuery } from "../course-model";
import { useCoursePages } from "./useCoursePages";
import styles from "../discovery.module.css";

function navigate(query: CourseQuery, replace = false) {
  const href = discoveryHref(query);
  if (replace) window.history.replaceState(null, "", href);
  else window.history.pushState(null, "", href);
}

function replaceQuery(query: CourseQuery) {
  window.history.replaceState(null, "", withQuery(window.location.pathname, queryString(query)));
}

export default function CourseSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  // Course links carry the originating query, including when reached via Back.
  const query = readCourseQuery(params);
  const queryKey = queryString(query);
  const [search, setSearch] = useState(query.search);
  const { result, departments, loading, error, retry } = useCoursePages(queryKey, replaceQuery);

  useEffect(() => {
    if (pathname === DISCOVERY_PATH && params.toString() !== queryKey) {
      window.history.replaceState(null, "", discoveryHref(readCourseQuery(params)));
    }
  }, [pathname, params, queryKey]);

  useEffect(() => {
    setSearch(readCourseQuery(new URLSearchParams(queryKey)).search);
  }, [queryKey]);

  useEffect(() => {
    if (pathname !== DISCOVERY_PATH || search.trim() === query.search) return;
    const timeout = window.setTimeout(() => navigate({ search: search.trim(), department: query.department, page: 1 }, true), 300);
    return () => window.clearTimeout(timeout);
  }, [search, query.search, query.department, pathname]);

  const updating = loading || search.trim() !== query.search;
  const currentPage = error ? null : result;
  const firstShown = currentPage && currentPage.total ? (currentPage.query.page - 1) * PAGE_SIZE + 1 : 0;

  function clearFilters() {
    setSearch("");
    navigate(EMPTY_QUERY);
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
            {query.department && !departments.includes(query.department) && <option value={query.department}>{query.department}</option>}
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </div>
        {(search || query.department) && <button className={styles.textButton} onClick={clearFilters} type="button">Clear filters</button>}
      </section>

      <div className={styles.resultHeader} role="status" aria-live="polite">
        <p>{loading ? "Finding courses…" : error ? "Courses unavailable" : result ? `${result.total.toLocaleString()} ${result.total === 1 ? "course" : "courses"} found` : "Browse courses"}</p>
        {currentPage && currentPage.total > 0 && <span>{firstShown}–{Math.min(firstShown + PAGE_SIZE - 1, currentPage.total)} of {currentPage.total.toLocaleString()}</span>}
      </div>

      {error ? (
        <div className={styles.empty} role="alert"><h2>Let’s try that again.</h2><p>{error}</p><button className={styles.button} type="button" onClick={retry}>Try again</button></div>
      ) : !currentPage ? (
        <div className={styles.skeleton} aria-label="Loading courses" aria-busy="true"><div /><div /><div /></div>
      ) : currentPage.total === 0 ? (
        <div className={styles.empty}><h2>{currentPage.catalogueTotal === 0 ? "No courses yet" : "No courses found"}</h2><p>{currentPage.catalogueTotal === 0 ? "The catalogue is empty. Please check back soon." : "Try a different keyword or clear your filters."}</p>{currentPage.catalogueTotal > 0 && <button className={styles.button} type="button" onClick={clearFilters}>Clear filters</button>}</div>
      ) : (
        <ul className={styles.results} aria-busy={loading}>
          {currentPage.courses.map((course) => (
            <li key={course.courseCode}>
              <Link href={withQuery(courseHref(course), queryKey)} prefetch={false} scroll={false} className={styles.courseRow}>
                <span className={styles.courseCode}>{course.courseCode}</span>
                <div><h2>{course.title}</h2><p>{course.preview || "Open this course to learn more."}</p></div>
                <span className={styles.rowAction} aria-hidden="true">View course ↗</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {currentPage && currentPage.total > 0 && (
        <nav className={styles.pagination} aria-label="Course results pages">
          <button className={styles.button} type="button" disabled={updating || currentPage.query.page === 1} onClick={() => { navigate({ ...currentPage.query, page: currentPage.query.page - 1 }); window.scrollTo(0, 0); }}>Previous</button>
          <span>Page {currentPage.query.page} of {currentPage.pageCount}</span>
          <button className={styles.button} type="button" disabled={updating || currentPage.query.page === currentPage.pageCount} onClick={() => { navigate({ ...currentPage.query, page: currentPage.query.page + 1 }); window.scrollTo(0, 0); }}>Next</button>
        </nav>
      )}
    </>
  );
}
