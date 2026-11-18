import { notFound, redirect } from "next/navigation";
import { loginHref } from "@/features/auth/return-to";
import { getProfile, getViewer, type ProfileView } from "../profiles";
import { profileHref } from "../profile-model";
import { getConnectionsOverview, getRelationship } from "../connections";
import Avatar from "./Avatar";
import ConnectionControls from "./ConnectionControls";
import ConnectionsSection from "./ConnectionsSection";
import DeleteAccount from "./DeleteAccount";
import ContactDetails from "./ContactDetails";
import HelpOfferEditor from "./HelpOfferEditor";
import HelpOffers from "./HelpOffers";
import OwnProfile from "./OwnProfile";
import { ID_CARD, PROFILE_GRID, SECTION_TITLE } from "./profile-styles";

export type ProfileParams = Promise<{ id: string }>;

export default async function ProfileContent({ params }: { params: ProfileParams }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(loginHref(profileHref(id)));
  const profile = await getProfile(viewer, id);
  if (!profile) notFound();
  const overview = profile.isOwner ? await getConnectionsOverview(viewer) : null;
  const relationship = profile.isOwner ? null : await getRelationship(viewer, id);
  const ownProfile = !profile.isOwner && relationship?.status === "none" && profile.helpOffers.length
    ? await getProfile(viewer, viewer.studentId) : null;
  const hasContacts = !!(ownProfile?.isOwner && Object.values(ownProfile.contacts).some(Boolean));

  const identity = <Identity profile={profile} />;
  return (
    <article aria-labelledby="profile-name" className={PROFILE_GRID}>
      {profile.isOwner ? (
        <OwnProfile
          bio={profile.bio}
          hasPicture={profile.pictureUrl !== null}
          pictureUrl={profile.pictureUrl}
          initials={profile.initials}
          contacts={profile.contacts}
          identity={identity}
          contactDetails={<ContactDetails contacts={profile.contacts} isOwner />}
          about={<ProfileDetails profile={profile} />}
        >
          {/* Always editable, outside edit mode: it's what students change most. */}
          <HelpOfferEditor offers={profile.helpOffers} />
          {overview && <ConnectionsSection overview={overview} />}
          <DeleteAccount />
        </OwnProfile>
      ) : (
        <>
          <aside aria-label="Student" className={ID_CARD}>
            {identity}
            {relationship && <ConnectionControls studentId={id} displayName={profile.displayName} relationship={relationship} offers={profile.helpOffers} ownProfileHref={profileHref(viewer.studentId)} hasContacts={hasContacts} />}
            {profile.contacts && <ContactDetails contacts={profile.contacts} isOwner={false} />}
          </aside>
          <div className="flex min-w-0 animate-fade-up flex-col gap-11">
            <ProfileDetails profile={profile} />
            <HelpOffers offers={profile.helpOffers} />
          </div>
        </>
      )}
    </article>
  );
}

function Identity({ profile }: { profile: ProfileView }) {
  const count = profile.helpOffers.length;
  return (
    <>
      <Avatar size="large" initials={profile.initials} pictureUrl={profile.pictureUrl} />
      <div>
        <h1 id="profile-name" className="font-display text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] [overflow-wrap:anywhere]">
          {profile.displayName}
        </h1>
        <p className="mt-1.5 text-muted">
          {count ? `Offers help with ${count} ${count === 1 ? "course" : "courses"}` : "No Help Offers yet"}
        </p>
      </div>
    </>
  );
}

function ProfileDetails({ profile }: { profile: ProfileView }) {
  return (
    <section aria-labelledby="profile-about">
      <h2 id="profile-about" className={SECTION_TITLE}>About</h2>
      {profile.bio ? (
        // Rendered as text, so markup and links in a bio stay inert.
        <p className="mt-3.5 max-w-[62ch] text-lg leading-[1.7] whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{profile.bio}</p>
      ) : (
        <p className="mt-3.5 text-subtle">{profile.isOwner ? "You haven’t written a bio yet." : "No bio yet."}</p>
      )}
    </section>
  );
}
