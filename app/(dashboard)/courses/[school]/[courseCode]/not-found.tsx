import { CourseNotFound } from "@/features/dashboard/components/CourseFeedback";
import styles from "@/features/dashboard/discovery.module.css";

export default function NotFound() {
  return <main className={styles.standalone}><CourseNotFound /></main>;
}
