import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faDiscord } from "@fortawesome/free-brands-svg-icons/faDiscord";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { CONTACT_FIELDS, type ContactField, type Contacts } from "../profile-model";
import CopyButton from "./CopyButton";
import Icon from "./Icon";
import PrivateBadge from "./PrivateBadge";

const CONTACT_LINK =
  "inline-flex min-h-9 min-w-0 cursor-pointer items-center gap-2.5 rounded-sm text-ink-2 underline decoration-line-strong underline-offset-[3px] [overflow-wrap:anywhere] transition-colors duration-150 hover:text-brand-strong hover:decoration-current [&_svg]:shrink-0 [&_svg]:text-lg [&_svg]:text-brand-strong";

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
    <a className={CONTACT_LINK} href={phoneHref(phone)}>
      <Icon icon={faPhone} /><span className="sr-only">Phone: </span>{phone}
    </a>
  ),
  // Discord has no username links, so clicking copies the username instead.
  discord: (discord) => (
    <CopyButton value={discord} label={`Discord: ${discord}. Copy username`} className={CONTACT_LINK}>
      <Icon icon={faDiscord} />{discord}
    </CopyButton>
  ),
  instagram: (instagram) => (
    <a className={CONTACT_LINK} href={instagramHref(instagram)} target="_blank" rel="noopener noreferrer">
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
    <section className="flex flex-col gap-3 border-t border-line pt-5" aria-labelledby="profile-contacts">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="profile-contacts" className="font-display text-base leading-[1.3] font-semibold">Contact details</h2>
        <PrivateBadge />
      </div>
      {filled.length ? (
        <ul className="flex flex-col gap-1.5">
          {filled.map(({ field, value }) => <li key={field} className="flex min-w-0 items-center gap-2.5">{CONTACT_LINKS[field](value)}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-subtle">No contact details yet. Add them with Edit profile.</p>
      )}
    </section>
  );
}
