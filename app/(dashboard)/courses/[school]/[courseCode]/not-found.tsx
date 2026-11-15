import { CourseNotFound } from "@/features/dashboard/components/CourseFeedback";

export default function NotFound() {
  return <main className="mx-auto w-full max-w-[960px] px-6 pt-14 pb-18 max-[640px]:px-4.5 max-[640px]:pt-8 max-[640px]:pb-12 [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-indigo-500 [&_a:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-indigo-500 [&_button:focus-visible]:outline-offset-3"><CourseNotFound /></main>;
}
