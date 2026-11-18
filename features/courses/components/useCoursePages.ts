"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { fetchCoursePage, queryString } from "../course-model";
import type { CoursePage, CourseQuery } from "../course-model";

// Keep nearby history entries without accumulating the catalogue.
const RECENT_PAGES = 5;

function remember(pages: Map<string, CoursePage>, queryKey: string, page: CoursePage) {
  const next = new Map(pages);
  next.delete(queryKey);
  next.set(queryKey, page);
  const oldest = next.keys().next().value;
  if (next.size > RECENT_PAGES && oldest !== undefined) next.delete(oldest);
  return next;
}

/**
 * Fetches the results page for `queryKey`, aborting older requests and caching a few recent pages.
 * `onNormalize` runs when the server corrected the query (for example, an out-of-range page).
 */
export function useCoursePages(queryKey: string, onNormalize: (query: CourseQuery) => void) {
  const [pages, setPages] = useState<Map<string, CoursePage>>(() => new Map());
  const [departments, setDepartments] = useState<string[]>([]);
  const [settled, setSettled] = useState<{
    queryKey: string;
    attempt: number;
    error: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const normalize = useEffectEvent(onNormalize);

  useEffect(() => {
    const controller = new AbortController();
    fetchCoursePage(queryKey, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        const resultKey = queryString(data.query);
        setDepartments(data.departments);
        setPages((previous) => remember(previous, resultKey, data));
        setSettled({ queryKey, attempt, error: "" });
        if (resultKey !== queryKey) normalize(data.query);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSettled({ queryKey, attempt, error: "Could not load courses. Please try again." });
      });
    return () => controller.abort();
  }, [queryKey, attempt]);

  // A new query or retry is pending immediately, before its effect runs.
  const loading = settled?.queryKey !== queryKey || settled?.attempt !== attempt;
  const error = loading ? "" : settled?.error ?? "";

  return {
    result: pages.get(queryKey) ?? null,
    departments,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
