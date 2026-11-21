"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import CourseTag from "@/components/ui/CourseTag";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

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
import { useCoursePages } from "./useCoursePages";

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
  const query = readCourseQuery(params);
  const queryKey = queryString(query);
  const [search, setSearch] = useState(query.search);
  const { result, departments, loading, error, retry } = useCoursePages(
    queryKey,
    replaceQuery,
  );
  const input = useRef<HTMLInputElement>(null);
  const suggestionList = useRef<HTMLUListElement>(null);
  const sentinel = useRef<HTMLSpanElement>(null);
  const [stuck, setStuck] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (pathname === DISCOVERY_PATH && params.toString() !== queryKey) {
      window.history.replaceState(
        null,
        "",
        discoveryHref(readCourseQuery(params)),
      );
    }
  }, [pathname, params, queryKey]);

  // Reset the draft before committing a render for a different URL query.
  // This also prevents a stale draft from overwriting Back/Forward navigation.
  const [draftQueryKey, setDraftQueryKey] = useState(queryKey);
  if (draftQueryKey !== queryKey) {
    setDraftQueryKey(queryKey);
    setSearch(query.search);
  }

  useEffect(() => {
    if (pathname !== DISCOVERY_PATH || search.trim() === query.search) {
      return;
    }
    const timeout = window.setTimeout(() => {
      navigate(
        { search: search.trim(), department: query.department, page: 1 },
        true,
      );
    }, 300);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [search, query.search, query.department, pathname]);

  // "/" jumps to the search box from anywhere on the page, unless a field or the course panel has focus.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
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
  // Typing the start of a department code offers to filter by that department.
  const typed = search.trim().toUpperCase();
  const suggestions = /^[A-Z]{1,5}$/.test(typed)
    ? departments
        .filter(
          (department) =>
            department.startsWith(typed) && department !== query.department,
        )
        .slice(0, 5)
    : [];
  const showSuggestions = suggesting && suggestions.length > 0;

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

  function chooseSuggestion(department: string) {
    setSuggesting(false);
    setSearch("");
    navigate({ search: "", department, page: 1 });
    input.current?.focus();
  }

  function moveSuggestionFocus(event: React.KeyboardEvent, step: number) {
    const items = [
      ...(suggestionList.current?.querySelectorAll("button") ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = index + step;
    event.preventDefault();
    if (next < 0) {
      input.current?.focus();
    } else {
      items[Math.min(next, items.length - 1)]?.focus();
    }
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
          <div
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSuggesting(false);
              }
            }}
          >
            <div
              role="search"
              className="group relative flex h-14 items-center rounded-2xl border-[1.5px] border-line-strong bg-surface pr-2.5 pl-[50px] transition-[border-color,box-shadow] duration-250 ease-soft focus-within:border-brand focus-within:shadow-[0_0_0_5px_rgb(37_99_235/0.12),0_18px_40px_-24px_rgb(30_58_138/0.45)] hover:border-faint focus-within:hover:border-brand sm:h-16 sm:pl-[58px]"
            >
              <SearchIcon className="absolute left-4 size-6 text-subtle transition-[color,scale] duration-250 ease-soft group-focus-within:scale-105 group-focus-within:text-brand sm:left-5" />
              <label htmlFor="course-search" className="sr-only">
                Search courses
              </label>
              <input
                ref={input}
                id="course-search"
                type="search"
                maxLength={300}
                autoComplete="off"
                enterKeyHint="search"
                value={search}
                placeholder="Try CIS 3400, statistics or accounting"
                aria-describedby="course-search-tip"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSuggesting(true);
                }}
                onFocus={() => {
                  setSuggesting(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && showSuggestions) {
                    moveSuggestionFocus(event, 1);
                  }
                  if (event.key === "Escape" && showSuggestions) {
                    event.preventDefault();
                    setSuggesting(false);
                  }
                }}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[17px] placeholder:text-subtle focus:outline-none sm:text-[19px]"
              />
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
            </div>
            <span id="course-search-tip" className="sr-only">
              Results update as you type. Press slash to come back to this
              search box.
            </span>

            {showSuggestions && (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-10 rounded-[14px] border border-line bg-surface p-1.5 shadow-float transition-[opacity,translate] duration-250 ease-soft starting:-translate-y-1 starting:opacity-0">
                <p className="px-2.5 pt-2 pb-1.5 font-display text-xs leading-none font-medium text-subtle">
                  Departments
                </p>
                <ul
                  ref={suggestionList}
                  id="department-suggestions"
                  aria-label="Department suggestions"
                >
                  {suggestions.map((department) => (
                    <li key={department}>
                      <button
                        type="button"
                        onClick={() => {
                          chooseSuggestion(department);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowDown") {
                            moveSuggestionFocus(event, 1);
                          }
                          if (event.key === "ArrowUp") {
                            moveSuggestionFocus(event, -1);
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            setSuggesting(false);
                            input.current?.focus();
                          }
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-[9px] px-2.5 py-[9px] text-left text-ink-2 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-strong focus-visible:bg-brand-50 focus-visible:text-brand-strong focus-visible:outline-none"
                      >
                        <span className="inline-flex min-w-[54px] justify-center">
                          <CourseTag code={department} />
                        </span>
                        Show only {department} courses
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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
