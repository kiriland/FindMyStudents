import { notFound, redirect } from "next/navigation";
import { loginHref } from "@/features/auth/return-to";
import { getProfile, getViewer, type ProfileView } from "../profiles";
import { profileHref } from "../profile-model";
import { getConnectionsOverview, getRelationships } from "../connections";
import ConnectionControls from "./ConnectionControls";
import ConnectionsSection from "./ConnectionsSection";
import Avatar from "./Avatar";
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
  const overview = profile.isOwner ? await getConnectionsOverview(viewer) : null;
  const relationship = profile.isOwner ? null : (await getRelationships(viewer, [id])).get(id)!;
  const ownProfile = !profile.isOwner && relationship?.status === "none" && profile.helpOffers.length
    ? await getProfile(viewer, viewer.studentId) : null;
  const hasContacts = !!(ownProfile?.isOwner && Object.values(ownProfile.contacts).some(Boolean));
  return (
    <article aria-labelledby="profile-name">
      <header className={styles.header}>
        <Avatar size="large" initials={profile.initials} pictureUrl={profile.pictureUrl} />
        <h1 id="profile-name" className={styles.name}>{profile.displayName}</h1>
      </header>
      {profile.isOwner ? (
        <>
          <OwnProfile bio={profile.bio} hasPicture={profile.pictureUrl !== null} contacts={profile.contacts}>
            <ProfileDetails profile={profile} />
            <ContactDetails contacts={profile.contacts} />
          </OwnProfile>
          {/* Always editable, outside edit mode: it's what students change most. */}
          <HelpOfferEditor offers={profile.helpOffers} />
          {overview && <ConnectionsSection overview={overview} />}
        </>
      ) : (
        <>
          <ProfileDetails profile={profile} />
          <HelpOffers offers={profile.helpOffers} />
          {relationship && <ConnectionControls studentId={id} relationship={relationship} offers={profile.helpOffers} ownProfileHref={profileHref(viewer.studentId)} hasContacts={hasContacts} />}
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
