import Link from "next/link";
import type { HelpOfferView } from "../profiles";
import styles from "../profile.module.css";

/** Another student's Help Offers: links to the Courses, without controls. */
export default function HelpOffers({ offers }: { offers: HelpOfferView[] }) {
  return (
    <section className={styles.section} aria-labelledby="profile-help-offers">
      <h2 id="profile-help-offers">Offers help with</h2>
      {offers.length ? (
        <ul className={styles.chips}>
          {offers.map((offer) => (
            <li key={offer.courseCode} className={styles.chip}>
              <Link href={offer.href} title={offer.title}>{offer.courseCode}</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.status}>No Help Offers yet.</p>
      )}
    </section>
  );
}
