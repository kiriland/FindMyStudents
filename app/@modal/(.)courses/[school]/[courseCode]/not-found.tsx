import { CourseNotFound } from "@/features/courses/components/CourseFeedback";
import CourseModal from "@/features/courses/components/CourseModal";

export default function NotFound() {
  return (
    <CourseModal>
      <CourseNotFound />
    </CourseModal>
  );
}
