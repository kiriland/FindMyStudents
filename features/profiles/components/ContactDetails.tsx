import { faDiscord } from "@fortawesome/free-brands-svg-icons/faDiscord";
import { faInstagram } from "@fortawesome/free-brands-svg-icons/faInstagram";
import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";

import type { ContactField, Contacts } from "../profile-model";

import { CONTACT_FIELDS } from "../profile-model";
import CopyButton from "./CopyButton";
import Icon from "./Icon";
import PrivateBadge from "./PrivateBadge";

const CONTACT_LINK =
  "inline-flex min-h-9 min-w-0 cursor-pointer items-center gap-2.5 rounded-sm text-ink-2 underline decoration-line-strong underline-offset-[3px] [overflow-wrap:anywhere] transition-colors duration-150 hover:text-brand-strong hover:decoration-current [&_svg]:shrink-0 [&_svg]:text-lg [&_svg]:text-brand-strong";

/** A phone number as a `tel:` link target: only digits and a leading `+`. */
function phoneHref(phone: string) {
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replaceAll(/\D/g, "")}`;
}

function instagramHref(handle: string) {
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

/** How each contact detail is shown: the quickest way to use it. */
const CONTACT_LINKS: Record<ContactField, (value: string) => React.ReactNode> =
  {
    phone: (phone) => (
      <a className={CONTACT_LINK} href={phoneHref(phone)}>
        <Icon icon={faPhone} />
        <span className="sr-only">Phone: </span>
        {phone}
      </a>
    ),
    // Discord has no username links, so clicking copies the username instead.
    discord: (discord) => (
      <CopyButton
        value={discord}
        label={`Discord: ${discord}. Copy username`}
        className={CONTACT_LINK}
      >
        <Icon icon={faDiscord} />
        {discord}
      </CopyButton>
    ),
    instagram: (instagram) => (
      <a
        className={CONTACT_LINK}
        href={instagramHref(instagram)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon icon={faInstagram} />
        <span className="sr-only">Instagram: </span>@{instagram}
      </a>
    ),
  };

/** Contact details, or `empty` when there are none. */
export function ContactList({
  contacts,
  empty,
}: {
  contacts: Contacts;
  empty: string;
}) {
  const filled = CONTACT_FIELDS.flatMap((field) => {
    const value = contacts[field];
    return value ? [{ field, value }] : [];
  });
  return filled.length > 0 ? (
    <ul className="flex flex-col gap-1.5">
      {filled.map(({ field, value }) => (
        <li key={field} className="flex min-w-0 items-center gap-2.5">
          {CONTACT_LINKS[field](value)}
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-subtle">{empty}</p>
  );
}

/** A Profile's contact details. Only ever rendered for the owner or a Connection. */
export default function ContactDetails({
  contacts,
  isOwner,
}: {
  contacts: Contacts;
  isOwner: boolean;
}) {
  return (
    <section
      className="flex flex-col gap-3 border-t border-line pt-5"
      aria-labelledby="profile-contacts"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="profile-contacts"
          className="font-display text-base leading-[1.3] font-semibold"
        >
          Contact details
        </h2>
        {isOwner && <PrivateBadge label="Only you and your Connections" />}
      </div>
      <ContactList
        contacts={contacts}
        empty={
          isOwner
            ? "No contact details yet. Add them with Edit profile."
            : "No contact details yet."
        }
      />
    </section>
  );
}
