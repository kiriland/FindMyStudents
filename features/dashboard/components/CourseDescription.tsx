"use client";

import { useId, useState } from "react";
import styles from "../discovery.module.css";

export default function CourseDescription({ description, sourceUrl }: { description: string; sourceUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  // Long descriptions start clamped; the full text stays in the page either way.
  const collapsible = description.length > 280;
  return (
    <section className={styles.description} aria-label="Course description">
      <p id={id} className={collapsible && !expanded ? styles.descriptionCollapsed : undefined}>{description || "No description is available for this course."}</p>
      <div className={styles.detailLinks}>
        {collapsible && <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read more"}</button>}
        {sourceUrl && <a href={sourceUrl}>Official course catalogue ↗</a>}
      </div>
    </section>
  );
}
