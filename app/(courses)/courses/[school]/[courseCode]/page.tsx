import { Suspense } from "react";
import CourseContent from "@/features/courses/components/CourseContent";
import type { CourseParams } from "@/features/courses/components/CourseContent";
import { CourseLoading } from "@/features/courses/components/CourseFeedback";

export default function CoursePage({ params }: { params: CourseParams }) {
  return <main id="main" className="mx-auto w-full max-w-[808px] flex-1 px-4 pt-10 pb-20 sm:px-6 sm:pt-14"><Suspense fallback={<CourseLoading />}><CourseContent params={params} /></Suspense></main>;
}
