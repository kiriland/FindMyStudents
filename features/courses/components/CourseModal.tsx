"use client";

import { useRouter } from "next/navigation";

import { COURSE_HEADING_ID } from "../course-model";
import Dialog from "./Dialog";

export default function CourseModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Dialog
      title="Course details"
      labelledBy={COURSE_HEADING_ID}
      onDismiss={() => {
        router.back();
      }}
    >
      {children}
    </Dialog>
  );
}
