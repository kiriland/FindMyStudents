"use client";

import { useState } from "react";
import type { Volunteer } from "../volunteers";
import Dialog from "./Dialog";
import styles from "../discovery.module.css";

export default function VolunteerList({ volunteers, courseCode }: { volunteers: Volunteer[]; courseCode: string }) {
  const [selected, setSelected] = useState<Volunteer | null>(null);
  return (
    <section className={styles.volunteerSection} aria-labelledby="volunteers-heading">
      <div className={styles.volunteerHeading}><h2 id="volunteers-heading">Students offering to help</h2><span className={styles.demoBadge}>Demo profiles</span></div>
      <p className={styles.demoNote}>These fictional profiles preview the experience. They are not real offers of help.</p>
      {volunteers.length === 0 ? (
        <div className={styles.empty}><h2>No volunteers yet</h2><p>There are no demo volunteers for {courseCode}. You can still explore the course details above.</p></div>
      ) : (
        <ul className={styles.volunteers}>
          {volunteers.map((volunteer) => (
            <li key={volunteer.id}>
              <button type="button" className={styles.volunteerCard} onClick={() => setSelected(volunteer)} aria-haspopup="dialog">
                <span className={styles.avatar} aria-hidden="true">{volunteer.initials}</span>
                <span><span className={styles.cardHeading}><span className={styles.volunteerName}>{volunteer.name}</span><span className={styles.demoBadge}>Demo profile</span></span><span className={styles.volunteerBio}>{volunteer.introduction}</span><span className={styles.helpNote}>{volunteer.help}</span><span className={styles.previewLink}>View demo profile ↗</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <Dialog title={`Demo profile: ${selected.name}`} onDismiss={() => setSelected(null)}>
          <span className={styles.demoBadge}>Fictional demo profile</span>
          <div className={styles.profileHeader}><span className={styles.avatar} aria-hidden="true">{selected.initials}</span><h2>{selected.name}</h2></div>
          <p className={styles.profileText}>{selected.biography}</p>
          <section className={styles.profileHelp}><h3>Help with {courseCode}</h3><p>{selected.help}</p></section>
          <p className={styles.demoNote}>Real student profiles and ways to connect are coming later. This sample person cannot be contacted.</p>
        </Dialog>
      )}
    </section>
  );
}
