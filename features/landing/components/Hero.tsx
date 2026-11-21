import Form from "next/form";
import Link from "next/link";

import { ArrowIcon } from "@/components/ui/icons";
import {
  DISCOVERY_PATH,
  discoveryHref,
  EMPTY_QUERY,
} from "@/features/courses/course-model";

const EXAMPLES = ["CIS 3400", "statistics", "accounting"];
// The headline and the search line share one size so the input reads as the sentence's last words.
const DISPLAY = "font-display text-[clamp(38px,6.4vw,84px)] tracking-[-0.04em]";
const BUTTON_SIZE = "clamp(48px,5.6vw,76px)";
const GAP = "clamp(12px,2vw,24px)";

/** A fill-in-the-blank course search: submitting opens the course directory with `q`. */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="pt-[clamp(28px,5vw,72px)] pb-[clamp(40px,6vw,80px)]"
    >
      <div className="wrap">
        <h1
          id="hero-title"
          className={`${DISPLAY} leading-[1.02] font-semibold [text-wrap:initial]`}
        >
          <span className="-mb-[0.08em] block overflow-hidden pb-[0.08em]">
            <span className="inline-block animate-rise">
              Find a Baruch student
            </span>
          </span>
          <span className="-mb-[0.08em] block overflow-hidden pb-[0.08em]">
            <span className="inline-block animate-rise [animation-delay:90ms]">
              who can help with
            </span>
          </span>
        </h1>

        <Form
          action={DISCOVERY_PATH}
          role="search"
          className={`group relative mt-[0.14em] flex max-w-[17ch] items-center max-sm:max-w-none ${DISPLAY} leading-none font-medium`}
          style={{ gap: GAP }}
        >
          <input
            name="q"
            type="search"
            maxLength={300}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="your course"
            aria-labelledby="hero-title"
            className="min-w-0 flex-1 animate-fade appearance-none border-0 bg-transparent pt-[0.02em] pb-[0.14em] text-brand-strong caret-brand [animation-delay:700ms] placeholder:text-faint focus:outline-none"
          />
          {/* The answer line: ink at rest, filling blue from the left while the field has focus. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[clamp(3px,0.45vw,6px)] origin-left animate-draw-x overflow-hidden rounded-[3px] bg-ink [animation-delay:320ms] after:absolute after:inset-0 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-[480ms] after:ease-soft after:content-[''] group-focus-within:after:scale-x-100"
            style={{ right: `calc(${BUTTON_SIZE} + ${GAP})` }}
          />
          <button
            type="submit"
            aria-label="Search courses"
            className="grid aspect-square flex-none animate-fade-up cursor-pointer place-items-center rounded-full bg-brand text-white transition-[background-color,transform] duration-150 ease-soft [animation-delay:820ms] hover:bg-brand-strong active:scale-95"
            style={{ width: BUTTON_SIZE }}
          >
            <ArrowIcon className="size-[44%] transition-transform duration-250 ease-soft group-focus-within:translate-x-0.5" />
          </button>
        </Form>

        <p className="mt-[clamp(22px,2.6vw,32px)] max-w-[60ch] animate-fade-up text-[clamp(17px,1.6vw,20px)] leading-relaxed text-muted [animation-delay:880ms]">
          FindMyStudents connects Baruch College students with classmates who
          offer help with specific courses.{" "}
          <strong className="font-semibold text-ink">
            Search any course in the catalogue
          </strong>
          , see who has volunteered to help with it, and get to know them
          through their profile.
        </p>

        <div className="mt-[18px] flex animate-fade-up flex-wrap items-center gap-2 text-subtle [animation-delay:980ms]">
          <span>Try</span>
          {EXAMPLES.map((search) => (
            <Link
              key={search}
              href={discoveryHref({ ...EMPTY_QUERY, search })}
              className="rounded-tag border border-line bg-surface px-[11px] py-[7px] font-display text-sm leading-none font-medium text-ink-2 transition-colors duration-150 hover:border-brand-200 hover:text-brand-strong"
            >
              {search}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
