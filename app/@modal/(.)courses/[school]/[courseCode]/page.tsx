import { Suspense } from "react";

import type { CourseParams } from "@/features/courses/components/CourseContent";

import CourseContent from "@/features/courses/components/CourseContent";
import { CourseLoading } from "@/features/courses/components/CourseFeedback";
import CourseModal from "@/features/courses/components/CourseModal";

export default function CourseModalPage({ params }: { params: CourseParams }) {
  return (
    <CourseModal>
      <Suspense fallback={<CourseLoading />}>
        <CourseContent params={params} />
      </Suspense>
    </CourseModal>
  );
}
