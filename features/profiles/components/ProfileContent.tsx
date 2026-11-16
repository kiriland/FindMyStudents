import { notFound, redirect } from "next/navigation";
import { loginHref } from "@/features/auth/return-to";
import { getProfile, getViewer, type ProfileView } from "../profiles";
import { profileHref } from "../profile-href";
import ContactDetails from "./ContactDetails";
import HelpOfferEditor from "./HelpOfferEditor";
import HelpOffers from "./HelpOffers";
import OwnProfile from "./OwnProfile";
import styles from "../profile.module.css";

export type ProfileParams = Promise<{ id: string }>;

export default async function ProfileContent({ params }: { params: ProfileParams }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(loginHref(profileHref(id)));
  const profile = await getProfile(viewer, id);
  if (!profile) notFound();
  return (
    <article aria-labelledby="profile-name">
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">{profile.initials}</span>
        <h1 id="profile-name" className={styles.name}>{profile.displayName}</h1>
      </header>
      {profile.isOwner && profile.contacts ? (
        <>
          <OwnProfile bio={profile.bio} contacts={profile.contacts}>
            <ProfileDetails profile={profile} />
            <ContactDetails contacts={profile.contacts} />
          </OwnProfile>
          {/* Always editable, outside edit mode: it's what students change most. */}
          <HelpOfferEditor offers={profile.helpOffers} />
        </>
      ) : (
        <>
          <ProfileDetails profile={profile} />
          <HelpOffers offers={profile.helpOffers} />
        </>
      )}
    </article>
  );
}

function ProfileDetails({ profile }: { profile: ProfileView }) {
  if (profile.bio) {
    // Rendered as text, so markup and links in a bio stay inert.
    return <p className={styles.bio}>{profile.bio}</p>;
  }
  return profile.isOwner ? <p className={styles.status}>You haven’t written a bio yet.</p> : null;
}
