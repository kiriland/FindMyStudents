import { Suspense } from "react";
import ProfileContent, { type ProfileParams } from "@/features/profiles/components/ProfileContent";
import { ProfileLoading } from "@/features/profiles/components/ProfileFeedback";
import styles from "@/features/profiles/profile.module.css";

export default function StudentProfilePage({ params }: { params: ProfileParams }) {
  return <main className={styles.page}><Suspense fallback={<ProfileLoading />}><ProfileContent params={params} /></Suspense></main>;
}
