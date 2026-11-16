"use client";

import PageContainer from "@/components/ui/PageContainer";

import CourseError from "@/features/dashboard/components/CourseError";

export default function Error({ retry }: { retry: () => void }) {
  return (
    <PageContainer>
      <CourseError retry={retry} />
    </PageContainer>
  );
}
