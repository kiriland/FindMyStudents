"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import SearchBar from "@/components/ui/SearchBar";

import type { CoursePage, CourseQuery } from "../course-model";

import {
  courseHref,
  DISCOVERY_PATH,
  discoveryHref,
  EMPTY_QUERY,
  PAGE_SIZE,
  queryString,
  readCourseQuery,
  withQuery,
} from "../course-model";
import CourseCard, { CourseCardSkeleton } from "./CourseCard";
import DepartmentPicker from "./DepartmentPicker";
import { searchWords } from "./Highlight";
import Pagination from "./Pagination";
import { useCoursePages, useSearchInput } from "./useCoursePages";

function navigate(query: CourseQuery, replace = false) {
  const href = discoveryHref(query);
  if (replace) {
    window.history.replaceState(null, "", href);
  } else {
    window.history.pushState(null, "", href);
  }
}

function replaceQuery(query: CourseQuery) {
  window.history.replaceState(
    null,
    "",
    withQuery(window.location.pathname, queryString(query)),
  );
}

const TOKEN =
  "inline-flex h-[30px] items-center gap-1 rounded-lg border border-brand-100 bg-brand-50 pr-1 pl-2.5 font-display text-sm leading-none font-medium text-brand-strong transition-[opacity,scale] duration-250 ease-soft starting:scale-90 starting:opacity-0";
const TOKEN_X =
  "grid size-[22px] cursor-pointer place-items-center rounded-md transition-colors duration-150 hover:bg-brand-100";

function searchStatus(
  loading: boolean,
  error: string,
  result: CoursePage | null,
) {
  if (loading) {
    return "Finding courses…";
  }
  if (error) {
    return "Courses unavailable";
  }
  if (!result) {
    return "Browse courses";
  }
  return `${result.total.toLocaleString()} ${result.total === 1 ? "course" : "courses"} found`;
}

export default function CourseSearch() {
  const pathname = usePathname();
  const params = useSearchParams();
  // Course links carry the originating query, including when reached via Back.
  // The field only writes to the URL on the dashboard itself, not under a course panel.
  const {
    query,
    queryKey,
    text: search,
    setText: setSearch,
  } = useSearchInput(pathname === DISCOVERY_PATH);
  const { result, departments, loading, error, retry } = useCoursePages(
    query,
    replaceQuery,
  );
  const input = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLSpanElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (pathname === DISCOVERY_PATH && params.toString() !== queryKey) {
      window.history.replaceState(
        null,
        "",
        discoveryHref(readCourseQuery(params)),
      );
    }
  }, [pathname, params, queryKey]);

  // "/" jumps to the search box from anywhere on the page, unless a field or the course panel has focus.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (
        target?.closest("input, textarea, select, [contenteditable]") ||
        document.querySelector("dialog[open]")
      ) {
        return;
      }
      event.preventDefault();
      input.current?.focus();
      input.current?.select();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // The search bar gains a hairline once it sticks under the navbar.
  useEffect(() => {
    const marker = sentinel.current;
    if (!marker) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 80);
        }
      },
      { rootMargin: "-69px 0px 0px 0px" },
    );
    observer.observe(marker);
    return () => {
      observer.disconnect();
    };
  }, []);

  const updating = loading || search.trim() !== query.search;
  const currentPage = error ? null : result;
  const firstShown = currentPage?.total
    ? (currentPage.query.page - 1) * PAGE_SIZE + 1
    : 0;
  const words = searchWords(query.search);

  function clearFilters() {
    setSearch("");
    navigate(EMPTY_QUERY);
  }

  function clearSearch() {
    setSearch("");
    navigate({ search: "", department: query.department, page: 1 });
    input.current?.focus({ preventScroll: true });
  }

  function chooseDepartment(department: string) {
    navigate({ search: search.trim(), department, page: 1 });
  }

  function goToPage(page: number) {
    if (!currentPage) {
      return;
    }
    navigate({ ...currentPage.query, page });
    const top = document.querySelector("#explore-classes");
    if (top && top.getBoundingClientRect().top < 0) {
      top.scrollIntoView({ block: "start" });
    }
  }

  const status = searchStatus(loading, error, result);

  return (
    <>
      <span ref={sentinel} aria-hidden="true" className="block h-px" />
      <div
        className={`sticky top-[68px] z-30 bg-canvas pt-3.5 pb-3 transition-shadow duration-250 ${stuck ? "shadow-[0_1px_0_var(--color-line)]" : ""}`}
      >
        <div className="wrap">
          <label htmlFor="course-search" className="sr-only">
            Search courses
          </label>
          <SearchBar
            ref={input}
            id="course-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Try CIS 3400, statistics or accounting"
            aria-describedby="course-search-tip"
            trailing={
              <>
                <kbd
                  aria-hidden="true"
                  className="mr-2 hidden h-[26px] min-w-[26px] place-items-center rounded-md border border-b-2 border-line-strong bg-canvas px-1.5 font-display text-[13px] leading-none font-medium text-subtle transition-opacity duration-150 group-focus-within:opacity-0 sm:inline-grid"
                >
                  /
                </kbd>
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={clearSearch}
                    className="grid size-10 cursor-pointer place-items-center rounded-ctl text-subtle transition-colors duration-150 hover:bg-well hover:text-ink"
                  >
                    <CloseIcon className="size-[18px]" />
                  </button>
                )}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-[18px] -bottom-[1.5px] h-0.5 overflow-hidden rounded-xs transition-opacity duration-150 ${updating ? "progress-sweep opacity-100" : "opacity-0"}`}
                />
              </>
            }
          />
          <span id="course-search-tip" className="sr-only">
            Results update as you type. Press slash to come back to this search
            box.
          </span>

          <p role="status" className="sr-only">
            {status}
          </p>
          <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2 text-muted">
            {loading && !currentPage && <span>Finding courses…</span>}
            {!loading && error && <span>Courses unavailable</span>}
            {currentPage && (
              <>
                <span>
                  <strong className="font-display font-semibold text-ink tabular-nums">
                    {currentPage.total.toLocaleString()}
                  </strong>{" "}
                  {currentPage.total === 1 ? "course" : "courses"} in
                </span>
                {query.department ? (
                  <span className={TOKEN}>
                    {query.department}
                    <button
                      type="button"
                      className={TOKEN_X}
                      aria-label={`Remove the ${query.department} department filter`}
                      onClick={() => {
                        chooseDepartment("");
                      }}
                    >
                      <CloseIcon className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex h-[30px] items-center rounded-lg border border-line bg-surface px-2.5 font-display text-sm leading-none font-medium text-ink-2">
                    all departments
                  </span>
                )}
                {query.search && (
                  <>
                    <span>matching</span>
                    <span className={`${TOKEN} max-w-full`}>
                      <span className="truncate">“{query.search}”</span>
                      <button
                        type="button"
                        className={TOKEN_X}
                        aria-label="Clear the search"
                        onClick={clearSearch}
                      >
                        <CloseIcon className="size-3" />
                      </button>
                    </span>
                  </>
                )}
                {query.search && query.department && (
                  <button
                    type="button"
                    className={`${LINK_CLASS} ml-1 text-sm`}
                    onClick={clearFilters}
                  >
                    Clear all
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="wrap grid items-start gap-3 pt-1 pb-[88px] min-[900px]:grid-cols-[236px_minmax(0,1fr)] min-[900px]:gap-9 min-[900px]:pt-3.5">
        <DepartmentPicker
          departments={departments}
          current={query.department}
          onSelect={chooseDepartment}
        />

        <section aria-label="Course results">
          {error && (
            <div
              role="alert"
              className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center"
            >
              <h2 className="font-display text-xl font-semibold">
                Let’s try that again
              </h2>
              <p className="mx-auto mt-2 mb-5 max-w-[44ch] text-muted">
                {error}
              </p>
              <button className={buttonClass()} type="button" onClick={retry}>
                Try again
              </button>
            </div>
          )}
          {!error && !currentPage && (
            <ul
              aria-label="Loading courses"
              aria-busy="true"
              className="grid gap-3.5 md:grid-cols-2"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index}>
                  <CourseCardSkeleton />
                </li>
              ))}
            </ul>
          )}
          {currentPage?.total === 0 && (
            <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
              <h2 className="font-display text-xl font-semibold">
                {currentPage.catalogueTotal === 0
                  ? "No courses yet"
                  : "No courses match"}
              </h2>
              <p className="mx-auto mt-2 mb-5 max-w-[44ch] text-muted">
                {currentPage.catalogueTotal === 0
                  ? "The catalogue is empty. Please check back soon."
                  : "Check the spelling, try a course code like CIS 3400, or clear your filters."}
              </p>
              {currentPage.catalogueTotal > 0 && (
                <button
                  className={buttonClass({ variant: "secondary" })}
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          {currentPage && currentPage.total > 0 && (
            <>
              <ul
                key={queryString(currentPage.query)}
                aria-busy={loading}
                className={`grid gap-3.5 transition-opacity duration-150 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}
              >
                {currentPage.courses.map((course, index) => (
                  <li
                    key={course.courseCode}
                    className="min-w-0 animate-fade-up [animation-duration:420ms]"
                    style={{
                      animationDelay: `${String(Math.min(index, 10) * 30)}ms`,
                    }}
                  >
                    <CourseCard
                      course={course}
                      href={withQuery(courseHref(course), queryKey)}
                      words={words}
                    />
                  </li>
                ))}
              </ul>
              <Pagination
                page={currentPage.query.page}
                pageCount={currentPage.pageCount}
                firstShown={firstShown}
                lastShown={Math.min(
                  firstShown + PAGE_SIZE - 1,
                  currentPage.total,
                )}
                total={currentPage.total}
                disabled={updating}
                onPage={goToPage}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
