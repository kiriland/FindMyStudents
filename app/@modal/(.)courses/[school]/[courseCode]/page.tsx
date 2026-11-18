import { Suspense } from "react";
import CourseContent from "@/features/courses/components/CourseContent";
import type { CourseParams } from "@/features/courses/components/CourseContent";
import CourseModal from "@/features/courses/components/CourseModal";
import { CourseLoading } from "@/features/courses/components/CourseFeedback";

export default function CourseModalPage({ params }: { params: CourseParams }) {
  return <CourseModal><Suspense fallback={<CourseLoading />}><CourseContent params={params} /></Suspense></CourseModal>;
}
