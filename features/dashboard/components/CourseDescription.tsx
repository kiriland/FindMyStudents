"use client";

import Button, { TextLink } from "@/components/Button";
import ActionGroup from "@/components/ui/ActionGroup";

import { useId, useState } from "react";

export default function CourseDescription({
  description,
  sourceUrl,
}: {
  description: string;
  sourceUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = description.length > 280;
  const visible =
    long && !expanded ? `${description.slice(0, 277).trimEnd()}…` : description;
  return (
    <section
      className="mt-5.5 border-b border-zinc-200 dark:border-[#303036] pb-7"
      aria-label="Course description"
    >
      <p
        className="text-[15px] leading-[1.75] whitespace-pre-line text-zinc-600 dark:text-zinc-300"
        id={id}
      >
        {visible || "No description is available for this course."}
      </p>
      <ActionGroup>
        {long && (
          <Button
            variant="text"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : "Read more"}
          </Button>
        )}
        <TextLink href={sourceUrl}>Official course catalogue ↗</TextLink>
      </ActionGroup>
    </section>
  );
}
