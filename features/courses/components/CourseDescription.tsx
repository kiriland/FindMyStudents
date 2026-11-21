"use client";

import { useId, useState } from "react";

import { LINK_CLASS } from "@/components/ui/button";

export default function CourseDescription({
  description,
  sourceUrl,
}: {
  description: string;
  sourceUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  // Long descriptions start clamped; the full text stays in the page either way.
  const collapsible = description.length > 280;
  const clamped = collapsible && !expanded;
  return (
    <section className="mt-[18px]" aria-label="Course description">
      <p
        id={id}
        className={`text-[17px] leading-[1.65] whitespace-pre-line text-ink-2 ${
          clamped
            ? "line-clamp-4 [mask-image:linear-gradient(#000_60%,transparent)]"
            : ""
        }`}
      >
        {description || "No description is available for this course."}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-[22px] gap-y-2 text-[15px]">
        {collapsible && (
          <button
            type="button"
            className={LINK_CLASS}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => {
              setExpanded((value) => !value);
            }}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-muted transition-colors duration-150 hover:text-brand-strong"
          >
            Official course catalogue
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </section>
  );
}
