"use client";

import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";

export default function CourseModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Dialog title="Course details" onDismiss={() => router.back()}>
      {children}
    </Dialog>
  );
}
