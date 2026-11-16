import { notFound, redirect } from "next/navigation";
import { loginHref } from "@/features/auth/return-to";
import { getProfile, getViewer } from "../profiles";
import styles from "../profile.module.css";

export type ProfileParams = Promise<{ id: string }>;

export default async function ProfileContent({ params }: { params: ProfileParams }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(loginHref(`/students/${encodeURIComponent(id)}`));
  const profile = await getProfile(viewer, id);
  if (!profile) notFound();
  return (
    <article aria-labelledby="profile-name">
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">{profile.initials}</span>
        <h1 id="profile-name" className={styles.name}>{profile.displayName}</h1>
      </header>
    </article>
  );
}
