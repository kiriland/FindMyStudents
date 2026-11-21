import type { ReactNode } from "react";

import CourseTag from "@/components/ui/CourseTag";
import { LogoMark } from "@/components/ui/Logo";

import { H2, LEDE, SECTION_Y } from "../styles";
import AccountCta from "./AccountCta";
import SampleAvatar from "./SampleAvatar";

interface Reason {
  title: string;
  text: string;
  visual: ReactNode;
}

const REASONS: Reason[] = [
  {
    title: "Find help by course",
    text: "Every course in the catalogue has its own page listing the students who offer help with it. No more asking around.",
    visual: (
      <span className="flex max-w-[220px] flex-wrap gap-1.5 md:justify-end">
        <CourseTag code="ACC 2101" />
        <CourseTag code="STA 2000" />
        <CourseTag code="CIS 3400" />
      </span>
    ),
  },
  {
    title: "Learn from classmates who know the material",
    text: "Volunteers choose the courses they understand well and want to help other students with.",
    visual: (
      <span className="flex">
        {["SP", "AL", "MC"].map((initials, index) => (
          <SampleAvatar
            key={initials}
            initials={initials}
            className={`size-[34px] border-2 border-surface text-xs ${index ? "-ml-1.5" : ""}`}
          />
        ))}
      </span>
    ),
  },
  {
    title: "Share what you know",
    text: "Add up to 15 courses to your Help Offers. Each one saves straight away, and you can remove it whenever you like.",
    visual: (
      <span className="flex w-[180px] flex-col gap-2 text-[13px] text-muted tabular-nums">
        <span>3 of 15 courses</span>
        <span className="h-1.5 overflow-hidden rounded-full bg-well">
          <i className="block h-full w-1/5 rounded-full bg-brand" />
        </span>
      </span>
    ),
  },
  {
    title: "Get to know someone first",
    text: "Profiles show a student’s first name and last initial, picture, bio and every course they offer help with.",
    visual: (
      <span className="flex items-center gap-2.5 rounded-card border border-line bg-surface py-2 pr-3.5 pl-2">
        <SampleAvatar initials="JR" />
        <span className="text-[15px] leading-[1.35] text-ink-2">
          <strong className="block font-display leading-[1.2] font-semibold text-ink">
            Jordan R.
          </strong>
          Offers help with 4 courses
        </span>
      </span>
    ),
  },
  {
    title: "Made for the Baruch community",
    text: "Courses come straight from the Baruch College course catalogue, and the project is built by Baruch students.",
    visual: (
      <span className="flex max-w-[200px] items-center gap-2.5 font-display text-sm leading-tight font-medium text-ink-2">
        <LogoMark className="size-[34px]" />
        Baruch College course catalogue
      </span>
    ),
  },
];

/** Reasons as a ruled list, each with a small piece of the product beside it. */
export default function WhyStudents() {
  return (
    <section aria-labelledby="why-title" className={SECTION_Y}>
      <div className="wrap grid items-start gap-[clamp(32px,6vw,80px)] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col items-start reveal lg:sticky lg:top-[100px]">
          <h2 id="why-title" className={H2}>
            Why students use FindMyStudents
          </h2>
          <p className={LEDE}>
            Built around the way Baruch students already think about school: one
            course at a time.
          </p>
          <AccountCta
            signedInLabel="Go to your profile"
            className="mt-[26px]"
          />
        </div>
        <ul>
          {REASONS.map((reason) => (
            <li
              key={reason.title}
              className="grid items-center gap-3.5 border-b border-line py-7 reveal first:border-t md:grid-cols-[minmax(0,1fr)_auto] md:gap-6"
            >
              <div>
                <h3 className="font-display text-[clamp(20px,2vw,24px)] leading-[1.2] font-semibold tracking-[-0.02em]">
                  {reason.title}
                </h3>
                <p className="mt-2 max-w-[46ch] text-[17px] leading-[1.55] text-muted">
                  {reason.text}
                </p>
              </div>
              <div
                aria-hidden="true"
                className="flex min-w-0 items-center md:justify-self-end"
              >
                {reason.visual}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
