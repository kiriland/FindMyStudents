import Link from "next/link";
import { Suspense } from "react";

import SearchBar from "@/components/ui/SearchBar";
import { discoveryHref, EMPTY_QUERY } from "@/features/courses/course-model";

import HeroSearch from "./HeroSearch";

const EXAMPLES = ["CIS 3400", "statistics", "accounting"];
const SEARCH_PLACEHOLDER = "Search a course, like CIS 3400";

/** The headline and a course search that opens the course directory. */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="pt-[clamp(28px,5vw,72px)] pb-[clamp(40px,6vw,80px)]"
    >
      <div className="wrap text-center">
        <h1
          id="hero-title"
          className="font-display text-[clamp(32px,4.6vw,60px)] leading-[1.02] font-semibold tracking-[-0.04em] [text-wrap:initial]"
        >
          <span className="-mb-[0.08em] block overflow-hidden pb-[0.08em]">
            <span className="inline-block animate-rise">
              Find a Baruch student
            </span>
          </span>
          <span className="-mb-[0.08em] block overflow-hidden pb-[0.08em]">
            <span className="inline-block animate-rise [animation-delay:90ms]">
              who can help
            </span>
          </span>
        </h1>

        <div className="relative z-10 mx-auto mt-[clamp(24px,3vw,36px)] max-w-[640px] animate-fade-up [animation-delay:700ms]">
          {/* The search reads the URL, so it renders in the browser; until then, the bar without its behaviour. */}
          <Suspense
            fallback={
              <SearchBar
                placeholder={SEARCH_PLACEHOLDER}
                aria-labelledby="hero-title"
              />
            }
          >
            <HeroSearch placeholder={SEARCH_PLACEHOLDER} />
          </Suspense>
        </div>

        <p className="mx-auto mt-[clamp(22px,2.6vw,32px)] max-w-[60ch] animate-fade-up text-[clamp(16px,1.4vw,18px)] leading-relaxed text-muted [animation-delay:880ms]">
          FindMyStudents connects Baruch College students with classmates who
          offer help with specific courses.{" "}
          <strong className="font-semibold text-ink">
            Search any course in the catalogue
          </strong>
          , see who has volunteered to help with it, and get to know them
          through their profile.
        </p>

        <div className="mt-[18px] flex animate-fade-up flex-wrap items-center justify-center gap-2 text-subtle [animation-delay:980ms]">
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
