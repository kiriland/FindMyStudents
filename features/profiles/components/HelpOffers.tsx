import type { HelpOfferView } from "../profiles";
import OfferCard from "./OfferCard";
import { SECTION_TITLE } from "./profile-styles";

/** Another student's Help Offers: links to the Courses, without controls. */
export default function HelpOffers({ offers }: { offers: HelpOfferView[] }) {
  return (
    <section aria-labelledby="profile-help-offers">
      <h2 id="profile-help-offers" className={SECTION_TITLE}>Offers help with</h2>
      {offers.length ? (
        <ul className="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
          {offers.map((offer) => <OfferCard key={offer.courseCode} offer={offer} />)}
        </ul>
      ) : (
        <p className="mt-3.5 text-subtle">No Help Offers yet.</p>
      )}
    </section>
  );
}
