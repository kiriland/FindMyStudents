"use client";

import { useRouter } from "next/navigation";
import Dialog from "./Dialog";

export default function CourseModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <Dialog title="Course details" onDismiss={() => router.back()}>{children}</Dialog>;
}
