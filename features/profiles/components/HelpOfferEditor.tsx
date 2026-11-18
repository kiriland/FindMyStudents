"use client";

import { useEffect, useState, useTransition } from "react";
import { INPUT_CLASS } from "@/components/Input";
import { buttonClass } from "@/components/ui/button";
import CourseTag from "@/components/ui/CourseTag";
import { ERROR_CLASS, HINT_CLASS, LABEL_CLASS, Spinner } from "@/components/ui/Field";
import { CloseIcon } from "@/components/ui/icons";
import { courseCodeKey, fetchCoursePage, type CoursePage, type CourseSummary } from "@/features/courses/course-model";
import { offerHelp, withdrawHelp } from "../actions";
import { MAX_HELP_OFFERS } from "../profile-model";
import type { HelpOfferView, Outcome } from "../profiles";
import OfferCard from "./OfferCard";
import { SavesNow } from "./PictureEditor";
import { SECTION_TITLE } from "./profile-styles";

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
 * Course, or remove one from its card.
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
    <section aria-labelledby="profile-help-offers">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
        <h2 id="profile-help-offers" className={SECTION_TITLE}>Your Help Offers</h2>
        <SavesNow label="Changes save straight away" />
      </div>
      <p className={`${HINT_CLASS} mt-2`}>
        Add the courses you can help other students with, up to {MAX_HELP_OFFERS}. You’ll appear on each course’s page.
      </p>

      <div className="mt-3.5 flex items-center gap-3.5 text-[15px] text-muted tabular-nums">
        <span role="status">{offers.length} of {MAX_HELP_OFFERS} courses</span>
        <span aria-hidden="true" className="h-1.5 max-w-60 flex-1 overflow-hidden rounded-full bg-well">
          <i
            className={`block h-full rounded-full transition-[width] duration-[420ms] ease-soft ${atLimit ? "bg-success" : "bg-brand"}`}
            style={{ width: `${(offers.length / MAX_HELP_OFFERS) * 100}%` }}
          />
        </span>
      </div>

      {offers.length ? (
        <ul aria-label="Your Help Offers" className="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.courseCode}
              offer={offer}
              action={
                <button
                  type="button"
                  aria-label={`Remove ${offer.courseCode}`}
                  disabled={isPending}
                  onClick={() => changeHelpOffer(offer.courseCode, withdrawHelp)}
                  className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full text-subtle transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyCode === offer.courseCode ? <Spinner /> : <CloseIcon className="size-3.5" />}
                </button>
              }
            />
          ))}
        </ul>
      ) : (
        <p className="mt-[18px] rounded-card border border-dashed border-line-strong bg-surface px-5 py-6 text-center text-muted">
          You haven’t offered help with any courses yet. Search below to add your first.
        </p>
      )}

      {message && <p role="alert" className={`${ERROR_CLASS} mt-3`}>{message}</p>}

      <div className="mt-6 flex max-w-[560px] flex-col gap-1.5">
        <label htmlFor="help-offer-search" className={LABEL_CLASS}>Add a course</label>
        <input
          id="help-offer-search"
          type="search"
          maxLength={300}
          autoComplete="off"
          value={text}
          placeholder="Course code, title or keyword"
          aria-describedby={atLimit ? "help-offer-limit" : undefined}
          onChange={(event) => setText(event.target.value)}
          className={INPUT_CLASS}
        />
        {atLimit && (
          <p id="help-offer-limit" className={`${HINT_CLASS} text-muted`}>
            You’ve reached the limit of {MAX_HELP_OFFERS} courses. Remove one to add another.
          </p>
        )}
        <CourseResults search={search} offered={offered} atLimit={atLimit} isPending={isPending} busyCode={busyCode}
          onAdd={(course) => changeHelpOffer(course.courseCode, offerHelp)} />
      </div>
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
  if (search.status === "loading") return <p role="status" className={`${HINT_CLASS} mt-1 flex items-center gap-2`}><Spinner />Finding courses…</p>;
  if (search.status === "error") return <p role="alert" className={`${ERROR_CLASS} mt-1`}>Could not load courses. Please try again.</p>;
  const { courses, total } = search.page;
  if (!total) return <p role="status" className={`${HINT_CLASS} mt-1`}>No courses found. Try a different keyword.</p>;
  return (
    <>
      <ul aria-label="Matching courses" className="mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-float transition-[opacity,translate] duration-250 ease-soft starting:-translate-y-1 starting:opacity-0">
        {courses.slice(0, SHOWN_RESULTS).map((course) => {
          const isOffered = offered.has(courseCodeKey(course.courseCode));
          return (
            <li key={course.courseCode} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-well py-2.5 pr-2.5 pl-4 first:border-t-0 sm:grid-cols-[100px_minmax(0,1fr)_auto]">
              <span><CourseTag code={course.courseCode} size="sm" /></span>
              <span className="text-[15px] text-ink-2 [overflow-wrap:anywhere] max-sm:col-start-1 max-sm:row-start-2">{course.title}</span>
              <button
                type="button"
                className={buttonClass({ variant: isOffered ? "ghost" : "secondary", size: "sm", className: "max-sm:row-span-2" })}
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
        <p className={`${HINT_CLASS} mt-1`}>Showing {SHOWN_RESULTS} of {total.toLocaleString()} courses. Type more to narrow the list.</p>
      )}
    </>
  );
}
