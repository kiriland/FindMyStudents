"use client";

import CourseError from "@/features/courses/components/CourseError";
import CourseModal from "@/features/courses/components/CourseModal";

export default function Error({ retry }: { retry: () => void }) {
  return <CourseModal><CourseError retry={retry} /></CourseModal>;
}
