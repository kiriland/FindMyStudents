import { CourseNotFound } from "@/features/courses/components/CourseFeedback";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-[808px] flex-1 px-4 pt-10 pb-20 sm:px-6 sm:pt-14"
    >
      <CourseNotFound />
    </main>
  );
}
