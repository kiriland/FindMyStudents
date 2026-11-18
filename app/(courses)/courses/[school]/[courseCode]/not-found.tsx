import { CourseNotFound } from "@/features/courses/components/CourseFeedback";
import styles from "@/features/courses/course.module.css";

export default function NotFound() {
  return <main className={styles.standalone}><CourseNotFound /></main>;
}
