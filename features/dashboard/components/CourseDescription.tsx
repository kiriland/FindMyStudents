"use client";

import { useId, useState } from "react";
import styles from "../discovery.module.css";

export default function CourseDescription({ description, sourceUrl }: { description: string; sourceUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = description.length > 280;
  const visible = long && !expanded ? `${description.slice(0, 277).trimEnd()}…` : description;
  return (
    <section className={styles.description} aria-label="Course description">
      <p id={id}>{visible || "No description is available for this course."}</p>
      <div className={styles.detailLinks}>
        {long && <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read more"}</button>}
        <a href={sourceUrl}>Official course catalogue ↗</a>
      </div>
    </section>
  );
}
