import Note from "@/components/ui/Note";
import { ButtonLink } from "@/components/Button";
import EmptyState from "@/components/ui/EmptyState";

export function CourseLoading() {
  return <Note role="status">Loading course details…</Note>;
}

export function CourseNotFound() {
  return (
    <EmptyState
      heading="h1"
      title="Course not found"
      description="This course is not in the current catalogue."
    >
      <ButtonLink href="/dashboard">Browse courses</ButtonLink>
    </EmptyState>
  );
}
