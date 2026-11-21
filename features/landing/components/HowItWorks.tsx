import type { ReactNode } from "react";

import CourseTag from "@/components/ui/CourseTag";
import { SearchIcon } from "@/components/ui/icons";

import { H2, LEDE, SECTION_Y } from "../styles";
import SampleAvatar from "./SampleAvatar";

interface Step {
  title: string;
  text: string;
  visual: ReactNode;
  range: string;
}

const STEPS: Step[] = [
  {
    title: "Search for a course",
    text: "Type a course code like CIS 3400, a title or a topic, or browse a department. Anyone can search, no account needed.",
    range: "md:scroll-range-[cover_17%_cover_19%]",
    visual: (
      <div className="flex h-[42px] w-full items-center gap-2 rounded-ctl border border-line-strong bg-surface px-3 font-display text-[15px] leading-none font-medium">
        <SearchIcon className="size-4 text-subtle" />
        <span>CIS 3400</span>
        <span className="h-[18px] w-0.5 animate-blink bg-brand" />
      </div>
    ),
  },
  {
    title: "Find students offering help",
    text: "Open the course to see which classmates have added it to their Help Offers. Log in to see who they are.",
    range: "md:scroll-range-[cover_31%_cover_33%]",
    visual: (
      <>
        <span className="flex">
          {["MC", "JR", "TK"].map((initials, index) => (
            <SampleAvatar
              key={initials}
              initials={initials}
              className={`size-[34px] border-2 border-surface text-xs ${index ? "-ml-1.5" : ""}`}
            />
          ))}
        </span>
        <span className="text-[15px] leading-[1.35] text-ink-2">
          <strong className="block font-display leading-[1.2] font-semibold text-ink">
            Students offering help
          </strong>
          Listed on every course page
        </span>
      </>
    ),
  },
  {
    title: "Explore their profiles",
    text: "Read their bio and see every course they offer help with, so you can tell who fits what you need.",
    range: "md:scroll-range-[cover_45%_cover_47%]",
    visual: (
      <>
        <SampleAvatar initials="MC" />
        <span className="text-[15px] leading-[1.35] text-ink-2">
          <strong className="block font-display leading-[1.2] font-semibold text-ink">
            Maya C.
          </strong>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <CourseTag code="CIS 3400" size="sm" />
            <CourseTag code="MTH 2003" size="sm" />
          </span>
        </span>
      </>
    ),
  },
];

/**
 * Three steps joined by a line that draws itself as the section scrolls by:
 * across the steps on wide screens, down beside each one on narrow screens.
 */
export default function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className={SECTION_Y}>
      <div className="wrap">
        <div className="reveal">
          <h2 id="how-title" className={H2}>
            How it works
          </h2>
          <p className={LEDE}>
            Three steps from “I’m stuck” to knowing who can help.
          </p>
        </div>

        <ol className="relative mt-12 grid gap-10 timeline-[--steps] md:grid-cols-3 md:gap-8">
          <li
            aria-hidden="true"
            className="absolute top-[21px] left-[22px] hidden h-0.5 w-[calc((100%-64px)*2/3+64px)] bg-line md:block"
          >
            <span className="absolute inset-0 origin-left bg-brand scroll-draw-x scroll-on-[--steps] scroll-range-[cover_18%_cover_46%]" />
          </li>
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="group relative flex flex-col pl-16 md:pl-0"
            >
              <span
                aria-hidden="true"
                className={`absolute top-0 left-0 z-10 grid size-11 place-items-center rounded-full border-2 border-brand bg-brand font-display text-[17px] leading-none font-semibold text-white scroll-dot-on scroll-on-[view()] scroll-range-[cover_40%_cover_44%] md:relative md:scroll-on-[--steps] ${step.range}`}
              >
                {index + 1}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-[50px] -bottom-[34px] left-[21px] w-0.5 bg-line md:hidden"
                >
                  <span className="absolute inset-0 origin-top bg-brand scroll-grow-y scroll-on-[view()] scroll-range-[cover_30%_cover_60%]" />
                </span>
              )}
              <h3 className="mt-2 font-display text-[21px] leading-tight font-semibold tracking-[-0.02em] md:mt-[22px]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[36ch] text-[17px] text-muted">
                {step.text}
              </p>
              <div
                aria-hidden="true"
                className="mt-[22px] flex min-h-[92px] items-center gap-2.5 rounded-xl border border-line bg-surface p-4 transition-[border-color,box-shadow,translate] duration-250 ease-soft group-hover:-translate-y-0.5 group-hover:border-brand-200 group-hover:shadow-lift"
              >
                {step.visual}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
