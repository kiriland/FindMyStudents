"use client";

import CourseError from "@/features/dashboard/components/CourseError";
import CourseModal from "@/features/dashboard/components/CourseModal";

export default function Error({ retry }: { retry: () => void }) {
  return <CourseModal><CourseError retry={retry} /></CourseModal>;
}
