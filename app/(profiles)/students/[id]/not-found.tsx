import { ProfileNotFound } from "@/features/profiles/components/ProfileFeedback";
import styles from "@/features/profiles/profile.module.css";

export default function NotFound() {
  return <main className={styles.page}><ProfileNotFound /></main>;
}
