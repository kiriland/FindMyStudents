import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faDiscord } from "@fortawesome/free-brands-svg-icons/faDiscord";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { CONTACT_FIELDS, type ContactField, type Contacts } from "../profile-model";
import CopyButton from "./CopyButton";
import Icon from "./Icon";
import styles from "../profile.module.css";

/** A phone number as a `tel:` link target: only digits and a leading `+`. */
function phoneHref(phone: string) {
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;
}

function instagramHref(handle: string) {
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

/** How each contact detail is shown: the quickest way to use it. */
const CONTACT_LINKS: Record<ContactField, (value: string) => React.ReactNode> = {
  phone: (phone) => (
    <a className={styles.contactLink} href={phoneHref(phone)}>
      <Icon icon={faPhone} /><span className="sr-only">Phone: </span>{phone}
    </a>
  ),
  // Discord has no username links, so clicking copies the username instead.
  discord: (discord) => (
    <CopyButton value={discord} label={`Discord: ${discord}. Copy username`}>
      <Icon icon={faDiscord} />{discord}
    </CopyButton>
  ),
  instagram: (instagram) => (
    <a className={styles.contactLink} href={instagramHref(instagram)} target="_blank" rel="noopener noreferrer">
      <Icon icon={faInstagram} /><span className="sr-only">Instagram: </span>@{instagram}
    </a>
  ),
};

/** The owner's own contact details. Only ever rendered for the owner. */
export default function ContactDetails({ contacts }: { contacts: Contacts }) {
  const filled = CONTACT_FIELDS.flatMap((field) => {
    const value = contacts[field];
    return value ? [{ field, value }] : [];
  });
  return (
    <section className={styles.section} aria-labelledby="profile-contacts">
      <div className={styles.sectionHeader}>
        <h2 id="profile-contacts">Contact details</h2>
        <span className={styles.private}>Only visible to you</span>
      </div>
      {filled.length ? (
        <ul className={styles.contacts}>
          {filled.map(({ field, value }) => <li key={field}>{CONTACT_LINKS[field](value)}</li>)}
        </ul>
      ) : (
        <p className={styles.status}>No contact details yet. Add them with Edit profile.</p>
      )}
    </section>
  );
}
