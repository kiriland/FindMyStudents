"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { courseCodeKey, fetchCoursePage, type CoursePage, type CourseSummary } from "@/features/courses/course-model";
import { offerHelp, withdrawHelp } from "../actions";
import { MAX_HELP_OFFERS } from "../profile-model";
import type { HelpOfferView, Outcome } from "../profiles";
import styles from "../profile.module.css";

const SHOWN_RESULTS = 8;

type Search = { status: "idle" } | { status: "loading" } | { status: "error" } | { status: "done"; page: CoursePage };
// The last fetch's outcome, tagged with the query it answered.
type Result = { query: string } & ({ status: "error" } | { status: "done"; page: CoursePage });

/** Courses matching `text`, found the same way the dashboard finds them. */
function useCourseSearch(text: string): Search {
  const [result, setResult] = useState<Result | null>(null);
  const query = text.trim();

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetchCoursePage(new URLSearchParams({ q: query }).toString(), controller.signal)
        .then((page) => {
          if (!controller.signal.aborted) setResult({ query, status: "done", page });
        })
        .catch(() => {
          if (!controller.signal.aborted) setResult({ query, status: "error" });
        });
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  // Idle and loading follow from the query, so they're derived rather than stored.
  if (!query) return { status: "idle" };
  if (result?.query !== query) return { status: "loading" };
  return result;
}

/**
 * The owner's Help Offers, always editable: search the catalogue to add a
 * Course, or remove one from its chip.
 */
export default function HelpOfferEditor({ offers }: { offers: HelpOfferView[] }) {
  const [text, setText] = useState("");
  const search = useCourseSearch(text);
  const [isPending, startTransition] = useTransition();
  // The Course being added or removed, so only its button shows progress.
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const offered = new Set(offers.map((offer) => courseCodeKey(offer.courseCode)));
  const atLimit = offers.length >= MAX_HELP_OFFERS;

  function changeHelpOffer(courseCode: string, change: (courseCode: string) => Promise<Outcome>) {
    setBusyCode(courseCode);
    setMessage("");
    startTransition(async () => {
      // A rejected action (e.g. the network drops) must still free the button.
      const result = await change(courseCode).catch((): Outcome => ({ ok: false, message: "That course could not be changed. Please try again." }));
      if (!result.ok) setMessage(result.message);
      setBusyCode(null);
    });
  }

  return (
    <section className={styles.section} aria-labelledby="profile-help-offers">
      <h2 id="profile-help-offers">Offers help with</h2>
      <p className={styles.hint}>
        Add the courses you can help other students with, up to {MAX_HELP_OFFERS}. Changes save straight away.
      </p>

      {offers.length ? (
        <ul className={styles.chips} aria-label="Your Help Offers">
          {offers.map((offer) => (
            <li key={offer.courseCode} className={styles.chip}>
              <Link href={offer.href} title={offer.title}>{offer.courseCode}</Link>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Remove ${offer.courseCode}`}
                disabled={isPending}
                onClick={() => changeHelpOffer(offer.courseCode, withdrawHelp)}
              >
                {busyCode === offer.courseCode ? "…" : "×"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.status}>You haven’t offered help with any courses yet.</p>
      )}

      <p role="status" className={styles.count}>{offers.length} / {MAX_HELP_OFFERS}</p>
      {atLimit && (
        <p className={styles.hint}>
          You’ve reached the limit of {MAX_HELP_OFFERS} courses. Remove one to add another.
        </p>
      )}
      {message && <p role="alert" className={styles.fieldError}>{message}</p>}

      <div className={styles.field}>
        <label htmlFor="help-offer-search">Add a course</label>
        <input
          id="help-offer-search"
          type="search"
          maxLength={300}
          value={text}
          placeholder="Course code, title, or keyword"
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <CourseResults search={search} offered={offered} atLimit={atLimit} isPending={isPending} busyCode={busyCode}
        onAdd={(course) => changeHelpOffer(course.courseCode, offerHelp)} />
    </section>
  );
}

type CourseResultsProps = {
  search: Search;
  offered: Set<string>;
  atLimit: boolean;
  isPending: boolean;
  busyCode: string | null;
  onAdd: (course: CourseSummary) => void;
};

function CourseResults({ search, offered, atLimit, isPending, busyCode, onAdd }: CourseResultsProps) {
  if (search.status === "idle") return null;
  if (search.status === "loading") return <p role="status" className={styles.status}>Finding courses…</p>;
  if (search.status === "error") return <p role="alert" className={styles.fieldError}>Could not load courses. Please try again.</p>;
  const { courses, total } = search.page;
  if (!total) return <p role="status" className={styles.status}>No courses found. Try a different keyword.</p>;
  return (
    <>
      <ul className={styles.courseResults} aria-label="Matching courses">
        {courses.slice(0, SHOWN_RESULTS).map((course) => {
          const isOffered = offered.has(courseCodeKey(course.courseCode));
          return (
            <li key={course.courseCode}>
              <span className={styles.resultCode}>{course.courseCode}</span>
              <span className={styles.resultTitle}>{course.title}</span>
              <button
                type="button"
                className={styles.button}
                disabled={isOffered || atLimit || isPending}
                aria-label={isOffered ? `${course.courseCode} added` : `Add ${course.courseCode}`}
                onClick={() => onAdd(course)}
              >
                {isOffered ? "Added" : busyCode === course.courseCode ? "Adding…" : "Add"}
              </button>
            </li>
          );
        })}
      </ul>
      {total > SHOWN_RESULTS && (
        <p className={styles.hint}>Showing {SHOWN_RESULTS} of {total.toLocaleString()} courses. Type more to narrow the list.</p>
      )}
    </>
  );
}
