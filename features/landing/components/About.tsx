import { LogoMark } from "@/components/ui/Logo";

import { H2 } from "../styles";
import SampleAvatar from "./SampleAvatar";

const STUDENTS = [
  {
    initials: "MC",
    name: "Maya C.",
    position: "left-[72%] top-[16%]",
    range: "scroll-range-[cover_30%_cover_40%]",
  },
  {
    initials: "JR",
    name: "Jordan R.",
    position: "left-[77%] top-1/2",
    range: "scroll-range-[cover_34%_cover_44%]",
  },
  {
    initials: "TK",
    name: "Tomás K.",
    position: "left-[72%] top-[84%]",
    range: "scroll-range-[cover_38%_cover_48%]",
  },
];
const LINKS = [
  "M34 37.5 C 46 37.5, 50 12, 62 12",
  "M34 37.5 L 66 37.5",
  "M34 37.5 C 46 37.5, 50 63, 62 63",
];

/** Why the project exists, beside a drawing of one Course and the students who offer help with it. */
export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="border-y border-line bg-surface py-[clamp(56px,8vw,104px)]"
    >
      <div className="wrap grid items-center gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="reveal">
          <h2 id="about-title" className={H2}>
            Why FindMyStudents exists
          </h2>
          <p className="mt-[18px] max-w-[32ch] font-display text-[clamp(21px,2.2vw,27px)] leading-[1.38] font-medium tracking-[-0.015em] text-pretty">
            Getting stuck on a course is common. Finding the classmate who
            understands it shouldn’t depend on who you happen to sit next to.
          </p>
          <p className="mt-4 max-w-[54ch] text-lg leading-[1.65] text-muted">
            Group chats and word of mouth only reach so far. FindMyStudents
            organises help around the course itself: students list the courses
            they can help with, and anyone working through one of those courses
            can find them in one place.
          </p>
          <p className="mt-[26px] flex max-w-[54ch] items-start gap-3 rounded-xl bg-well px-4 py-3.5 text-[15px] leading-normal text-ink-2">
            <LogoMark className="mt-px size-5" />
            <span>
              An independent student project, built by Baruch students for the
              Baruch College community. It isn’t an official Baruch College
              service.
            </span>
          </p>
        </div>

        <figure
          aria-label="Illustration: a course connected to the students who offer help with it"
          className="relative mb-[34px] aspect-[4/3] w-full max-w-[520px] justify-self-center timeline-[--diagram] lg:mb-0 lg:justify-self-end"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_1px_1px,var(--color-line)_1px,transparent_1.4px)] [mask-image:radial-gradient(closest-side,#000_55%,transparent)] bg-size-[18px_18px]"
          />
          <svg
            viewBox="0 0 100 75"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            {LINKS.map((d) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                className="fill-none stroke-brand-200 [stroke-width:2] scroll-dash [stroke-dasharray:1] [stroke-dashoffset:0] [stroke-linecap:round] [vector-effect:non-scaling-stroke] scroll-on-[--diagram] scroll-range-[entry_40%_cover_50%]"
              />
            ))}
          </svg>
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-[23%] flex -translate-1/2 flex-col gap-1.5 rounded-card border border-brand-200 bg-surface px-3.5 py-3 shadow-float sm:px-[18px] sm:py-4"
          >
            <span className="font-display text-[clamp(20px,2.6vw,28px)] leading-none tracking-[-0.02em] whitespace-nowrap text-brand-strong tabular-nums">
              <b className="font-semibold">CIS</b> 3400
            </span>
            <span className="hidden text-[13px] whitespace-nowrap text-muted sm:block">
              Database Management Systems
            </span>
          </div>
          {STUDENTS.map((student) => (
            <div
              key={student.name}
              aria-hidden="true"
              className={`absolute ${student.position} ${student.range} flex -translate-1/2 items-center gap-2 rounded-full border border-line bg-surface py-[5px] pr-2.5 pl-[5px] whitespace-nowrap shadow-[0_6px_18px_-10px_rgb(30_58_138/0.3)] scroll-pop scroll-on-[--diagram] sm:pr-3`}
            >
              <SampleAvatar
                initials={student.initials}
                className="size-8 text-xs"
              />
              <span>
                <strong className="block font-display text-sm leading-[1.1] font-semibold">
                  {student.name}
                </strong>
                <small className="hidden text-xs text-subtle sm:block">
                  Offers help
                </small>
              </span>
            </div>
          ))}
          <figcaption className="absolute inset-x-0 -bottom-[34px] text-center text-sm text-subtle">
            Each course page lists the students who offer help with it.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
