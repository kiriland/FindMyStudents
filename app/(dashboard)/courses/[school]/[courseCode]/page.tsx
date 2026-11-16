import PageContainer from "@/components/ui/PageContainer";
import { Suspense } from "react";
import CourseContent from "@/features/dashboard/components/CourseContent";
import type { CourseParams } from "@/features/dashboard/components/CourseContent";
import { CourseLoading } from "@/features/dashboard/components/CourseFeedback";

export default function CoursePage({ params }: { params: CourseParams }) {
  return (
    <PageContainer>
      <Suspense fallback={<CourseLoading />}>
        <CourseContent params={params} />
      </Suspense>
    </PageContainer>
  );
}
