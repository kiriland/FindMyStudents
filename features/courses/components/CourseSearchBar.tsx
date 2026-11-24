"use client";

import type { ComponentProps, KeyboardEvent } from "react";

import Link from "next/link";
import { useRef, useState } from "react";

import CourseTag from "@/components/ui/CourseTag";
import SearchBar from "@/components/ui/SearchBar";

import type { CoursePage, CourseQuery } from "../course-model";

import { courseHref, queryString, withQuery } from "../course-model";
import Highlight, { searchWords } from "./Highlight";
import { useCoursePages } from "./useCoursePages";

const MAX_DEPARTMENTS = 3;
const MAX_COURSES = 6;
const HEADING =
  "px-2.5 pt-2 pb-1.5 font-display text-xs leading-none font-medium text-subtle";
// With the dropdown open, the bar and the dropdown share one border and focus ring, so they read
// as one box. The bar drops its bottom edge, and each half clips its ring at the seam so the two
// rings meet without overlapping. The hairline between them is an inset shadow on the dropdown,
// so it runs between the blue side borders instead of cutting through them.
const OPEN_BAR =
  "rounded-b-none! border-b-0! border-brand! shadow-[0_0_0_5px_rgb(37_99_235/0.12)]! [clip-path:inset(-6px_-6px_0_-6px)]";
const DROPDOWN =
  "absolute inset-x-0 top-full z-10 max-h-[min(440px,60vh)] overflow-y-auto rounded-b-2xl border-[1.5px] border-t-0 border-brand bg-surface p-1.5 text-left shadow-[inset_0_1px_0_var(--color-line),0_0_0_5px_rgb(37_99_235/0.12),0_18px_40px_-24px_rgb(30_58_138/0.45)] [clip-path:inset(0_-6px_-60px_-6px)] transition-opacity duration-150 ease-soft starting:opacity-0";
const ITEM =
  "flex w-full cursor-pointer items-center gap-3 rounded-[9px] px-2.5 py-[9px] text-left text-ink-2 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-strong focus-visible:bg-brand-50 focus-visible:text-brand-strong focus-visible:outline-none";

type CourseSearchBarProps = Omit<
  ComponentProps<typeof SearchBar>,
  "value" | "onChange"
> & {
  /** What's in the field, from `useSearchInput`. */
  value: string;
  onValueChange: (value: string) => void;
  /** The search in the URL, from `useSearchInput`; the dropdown shows its results. */
  query: CourseQuery;
  onChooseDepartment: (department: string) => void;
};

/** Department codes that start with what was typed, e.g. "CI" offers CIS. */
function suggestDepartments(text: string, departments: string[]) {
  const typed = text.trim().toUpperCase();
  if (!/^[A-Z]{1,5}$/.test(typed)) {
    return [];
  }
  return departments
    .filter((department) => department.startsWith(typed))
    .slice(0, MAX_DEPARTMENTS);
}

/**
 * The course search bar with a dropdown of matching courses, plus departments
 * to filter by when the text typed so far is the start of a department code.
 */
export default function CourseSearchBar({
  ref,
  value,
  onValueChange,
  query,
  onChooseDepartment,
  onFocus,
  onKeyDown,
  ...searchBar
}: CourseSearchBarProps) {
  const [suggesting, setSuggesting] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement | null>(null);
  const { result, loading, error } = useCoursePages(
    query.search ? query : null,
  );

  // Keep the last results on screen while the next search loads, so the list doesn't flash.
  // One value decides what's shown, so this settles after a single update.
  const [page, setPage] = useState<CoursePage | null>(null);
  const shown = value.trim() && !error ? (result ?? page) : null;
  if (shown !== page) {
    setPage(shown);
  }

  const departmentSuggestions = suggestDepartments(
    value,
    page?.departments ?? [],
  );
  const courses = page?.courses.slice(0, MAX_COURSES) ?? [];
  // Course links carry the search that found them, like the cards on the dashboard.
  const resultQuery = page ? queryString(page.query) : "";
  const words = searchWords(value);
  // Results are stale while the field is ahead of the URL or the next search is loading.
  const stale = loading || value.trim() !== query.search;
  const noMatches = !stale && result?.total === 0;
  const open =
    suggesting &&
    (departmentSuggestions.length > 0 || courses.length > 0 || noMatches);

  function setInput(node: HTMLInputElement | null) {
    field.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }

  function moveFocus(event: KeyboardEvent, step: number) {
    const items = [
      ...(menu.current?.querySelectorAll<HTMLElement>("button, a") ?? []),
    ];
    const next =
      items.findIndex((item) => item === document.activeElement) + step;
    event.preventDefault();
    if (next < 0) {
      field.current?.focus();
    } else {
      items[Math.min(next, items.length - 1)]?.focus();
    }
  }

  function chooseDepartment(department: string) {
    setSuggesting(false);
    onChooseDepartment(department);
    field.current?.focus();
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setSuggesting(false);
        }
      }}
    >
      <SearchBar
        {...searchBar}
        ref={setInput}
        className={`${searchBar.className ?? ""} ${open ? OPEN_BAR : ""}`}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setSuggesting(true);
        }}
        onFocus={(event) => {
          setSuggesting(true);
          onFocus?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && open) {
            moveFocus(event, 1);
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setSuggesting(false);
          }
          onKeyDown?.(event);
        }}
      />

      {open && (
        // Arrow keys move between suggestions; Escape returns to the field.
        <div
          ref={menu}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              moveFocus(event, 1);
            }
            if (event.key === "ArrowUp") {
              moveFocus(event, -1);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setSuggesting(false);
              field.current?.focus();
            }
          }}
          className={DROPDOWN}
        >
          {departmentSuggestions.length > 0 && (
            <>
              <p className={HEADING}>Departments</p>
              <ul aria-label="Department suggestions">
                {departmentSuggestions.map((department) => (
                  <li key={department}>
                    <button
                      type="button"
                      onClick={() => {
                        chooseDepartment(department);
                      }}
                      className={ITEM}
                    >
                      <span className="inline-flex min-w-[54px] justify-center">
                        <CourseTag code={department} />
                      </span>
                      Show only {department} courses
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {courses.length > 0 && (
            <>
              <p
                className={`${HEADING} ${departmentSuggestions.length > 0 ? "mt-1.5" : ""}`}
              >
                Courses
              </p>
              <ul
                aria-label="Course suggestions"
                className={`transition-opacity duration-150 ${stale ? "opacity-60" : ""}`}
              >
                {courses.map((course) => (
                  <li key={course.courseCode}>
                    <Link
                      href={withQuery(courseHref(course), resultQuery)}
                      prefetch={false}
                      scroll={false}
                      onClick={() => {
                        setSuggesting(false);
                      }}
                      className={ITEM}
                    >
                      <span className="inline-flex min-w-[88px] flex-none">
                        <CourseTag code={course.courseCode} size="sm" />
                      </span>
                      <span className="min-w-0 truncate">
                        <Highlight text={course.title} words={words} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {noMatches && departmentSuggestions.length === 0 && (
            <p className="px-2.5 py-3 text-muted">
              No courses match. Try a course code like CIS 3400.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
