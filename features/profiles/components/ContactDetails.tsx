import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faDiscord } from "@fortawesome/free-brands-svg-icons/faDiscord";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { instagramHref, phoneHref, type Contacts } from "../profile-fields";
import CopyButton from "./CopyButton";
import Icon from "./Icon";
import styles from "../profile.module.css";

/** The owner's own contact details. Only ever rendered for the owner. */
export default function ContactDetails({ contacts }: { contacts: Contacts }) {
  const { phone, discord, instagram } = contacts;
  return (
    <section className={styles.section} aria-labelledby="profile-contacts">
      <div className={styles.sectionHeader}>
        <h2 id="profile-contacts">Contact details</h2>
        <span className={styles.private}>Only visible to you</span>
      </div>
      {phone || discord || instagram ? (
        <ul className={styles.contacts}>
          {phone && (
            <li>
              <a className={styles.contactLink} href={phoneHref(phone)}>
                <Icon icon={faPhone} /><span className="sr-only">Phone: </span>{phone}
              </a>
            </li>
          )}
          {discord && (
            <li>
              <CopyButton value={discord} label={`Discord: ${discord}. Copy username`}>
                <Icon icon={faDiscord} />{discord}
              </CopyButton>
            </li>
          )}
          {instagram && (
            <li>
              <a className={styles.contactLink} href={instagramHref(instagram)} target="_blank" rel="noopener noreferrer">
                <Icon icon={faInstagram} /><span className="sr-only">Instagram: </span>@{instagram}
              </a>
            </li>
          )}
        </ul>
      ) : (
        <p className={styles.status}>No contact details yet. Add them with Edit profile.</p>
      )}
    </section>
  );
}
