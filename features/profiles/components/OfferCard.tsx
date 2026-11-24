import type { ReactNode } from "react";

import Link from "next/link";

import { getDepartment } from "@/features/courses/course-model";

import type { HelpOfferView } from "../profiles";

/**
 * A Help Offer as a small catalogue card linking to its Course. `action` sits
 * in the corner, for the owner's remove button.
 */
export default function OfferCard({
  offer,
  action,
}: {
  offer: HelpOfferView;
  action?: ReactNode;
}) {
  const department = getDepartment(offer.courseCode);
  const number = offer.courseCode.slice(department.length).trim();
  return (
    <li className="group relative rounded-xl border border-line bg-surface transition-[border-color,box-shadow,opacity,scale] duration-250 ease-soft hover:border-brand-200 hover:shadow-[0_10px_26px_-16px_rgb(30_58_138/0.3)] starting:scale-95 starting:opacity-0">
      <Link
        href={offer.href}
        aria-label={`${offer.courseCode}, ${offer.title}`}
        className="grid min-h-[76px] grid-cols-[66px_minmax(0,1fr)] overflow-hidden rounded-xl focus-visible:outline-offset-2"
      >
        <span
          aria-hidden="true"
          className="relative flex flex-col justify-center gap-1 overflow-hidden border-r border-brand-100 bg-brand-50 p-3 font-display before:absolute before:inset-0 before:translate-y-[101%] before:bg-brand before:transition-transform before:duration-[420ms] before:ease-soft before:content-[''] group-hover:before:translate-y-0 group-has-[a:focus-visible]:before:translate-y-0"
        >
          <b className="relative text-sm font-semibold text-brand-strong transition-colors duration-250 group-hover:text-white group-has-[a:focus-visible]:text-white">
            {department || offer.courseCode}
          </b>
          <span className="relative text-[19px] leading-none tracking-[-0.02em] text-ink tabular-nums transition-colors duration-250 group-hover:text-white group-has-[a:focus-visible]:text-white">
            {number}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`line-clamp-2 self-center py-3.5 pl-3.5 text-sm leading-[1.4] text-muted ${action ? "pr-11" : "pr-3.5"}`}
        >
          {offer.title}
        </span>
      </Link>
      {action}
    </li>
  );
}
