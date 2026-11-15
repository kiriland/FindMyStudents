"use client";

import { useId, useState } from "react";

export default function CourseDescription({ description, sourceUrl }: { description: string; sourceUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = description.length > 280;
  const visible = long && !expanded ? `${description.slice(0, 277).trimEnd()}…` : description;
  return (
    <section className="mt-5.5 border-b border-zinc-200 dark:border-[#303036] pb-7 [&_p]:text-[15px] [&_p]:leading-[1.75] [&_p]:whitespace-pre-line [&_p]:text-zinc-600 dark:[&_p]:text-zinc-300" aria-label="Course description">
      <p id={id}>{visible || "No description is available for this course."}</p>
      <div className="mt-3 flex flex-wrap gap-5 text-[13px] [&_a]:cursor-pointer [&_a]:underline [&_a]:underline-offset-4 [&_button]:cursor-pointer [&_button]:underline [&_button]:underline-offset-4">
        {long && <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read more"}</button>}
        <a href={sourceUrl}>Official course catalogue ↗</a>
      </div>
    </section>
  );
}
