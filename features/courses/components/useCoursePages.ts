"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import type { CoursePage, CourseQuery } from "../course-model";

import {
  fetchCoursePage,
  queryString,
  readCourseQuery,
  withQuery,
} from "../course-model";

// Keep nearby history entries without accumulating the catalogue.
const RECENT_PAGES = 5;
// How long typing must pause before a search runs.
const TYPING_DELAY = 300;

function remember(
  pages: Map<string, CoursePage>,
  queryKey: string,
  page: CoursePage,
) {
  const next = new Map(pages);
  next.delete(queryKey);
  next.set(queryKey, page);
  const oldest = next.keys().next().value;
  if (next.size > RECENT_PAGES && oldest !== undefined) {
    next.delete(oldest);
  }
  return next;
}

/**
 * Every course search in the app goes through here: fetches the results page
 * for `query`, aborting older requests and caching a few recent pages. A null
 * query fetches nothing. `onNormalize` runs when the server corrected the
 * query (for example, an out-of-range page).
 */
export function useCoursePages(
  query: CourseQuery | null,
  onNormalize?: (query: CourseQuery) => void,
) {
  const queryKey = query ? queryString(query) : null;
  const [pages, setPages] = useState<Map<string, CoursePage>>(() => new Map());
  const [departments, setDepartments] = useState<string[]>([]);
  const [settled, setSettled] = useState<{
    queryKey: string;
    attempt: number;
    error: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const normalize = useEffectEvent((corrected: CourseQuery) => {
    onNormalize?.(corrected);
  });

  useEffect(() => {
    if (queryKey === null) {
      return;
    }
    const controller = new AbortController();
    // The effect keys on the query's string form, so rebuild the query from it.
    fetchCoursePage(
      readCourseQuery(new URLSearchParams(queryKey)),
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }
        const resultKey = queryString(data.query);
        setDepartments(data.departments);
        setPages((previous) => remember(previous, resultKey, data));
        setSettled({ queryKey, attempt, error: "" });
        if (resultKey !== queryKey) {
          normalize(data.query);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setSettled({
          queryKey,
          attempt,
          error: "Could not load courses. Please try again.",
        });
      });
    return () => {
      controller.abort();
    };
  }, [queryKey, attempt]);

  // A new query or retry is pending immediately, before its effect runs.
  const loading =
    queryKey !== null &&
    (settled?.queryKey !== queryKey || settled.attempt !== attempt);
  const error = loading || settled?.queryKey !== queryKey ? "" : settled.error;

  return {
    result: queryKey === null ? null : (pages.get(queryKey) ?? null),
    departments,
    loading,
    error,
    retry: () => {
      setAttempt((value) => value + 1);
    },
  };
}

const COURSE_PARAMS = ["q", "department", "page"];

/** The current page's URL with its course search replaced by `query`; any other params stay. */
function currentUrlWith(query: CourseQuery) {
  const params = new URLSearchParams(window.location.search);
  for (const name of COURSE_PARAMS) {
    params.delete(name);
  }
  for (const [name, value] of new URLSearchParams(queryString(query))) {
    params.set(name, value);
  }
  return (
    withQuery(window.location.pathname, params.toString()) +
    window.location.hash
  );
}

/**
 * Every search field in the app uses this, so a search always lives in the
 * URL: `text` is what's in the field, and once typing pauses for 300ms it's
 * written to the current page's URL as `q` (replacing the history entry, and
 * going back to page 1). `query` is the search read back from the URL, so it
 * also follows links, reloads and Back/Forward. Pass `active: false` while
 * the page shouldn't own the URL.
 */
export function useSearchInput(active = true) {
  const params = useSearchParams();
  const query = readCourseQuery(params);
  const queryKey = queryString(query);
  const [text, setText] = useState(query.search);

  // When the URL's search changes from elsewhere (a link, Back/Forward), the
  // field follows it. Our own write already matches the field, so leave the
  // text alone then; trimming it would eat a space typed mid-word.
  const [seenQueryKey, setSeenQueryKey] = useState(queryKey);
  if (seenQueryKey !== queryKey) {
    setSeenQueryKey(queryKey);
    if (text.trim() !== query.search) {
      setText(query.search);
    }
  }

  useEffect(() => {
    const search = text.trim();
    if (!active || search === query.search) {
      return;
    }
    const timeout = window.setTimeout(() => {
      window.history.replaceState(
        null,
        "",
        currentUrlWith({ search, department: query.department, page: 1 }),
      );
    }, TYPING_DELAY);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [active, text, query.search, query.department]);

  return { query, queryKey, text, setText };
}
