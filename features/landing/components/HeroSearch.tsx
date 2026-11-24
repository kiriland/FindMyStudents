"use client";

import { useRouter } from "next/navigation";

import CourseSearchBar from "@/features/courses/components/CourseSearchBar";
import { useSearchInput } from "@/features/courses/components/useCoursePages";
import { discoveryHref, EMPTY_QUERY } from "@/features/courses/course-model";

/**
 * Suggests courses and departments as you type. Submitting opens the course
 * directory with that search; a suggestion opens that course or department.
 */
export default function HeroSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const { query, text: search, setText: setSearch } = useSearchInput();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        router.push(discoveryHref({ ...EMPTY_QUERY, search: search.trim() }));
      }}
    >
      <CourseSearchBar
        value={search}
        onValueChange={setSearch}
        query={query}
        onChooseDepartment={(department) => {
          router.push(discoveryHref({ ...EMPTY_QUERY, department }));
        }}
        placeholder={placeholder}
        aria-labelledby="hero-title"
      />
    </form>
  );
}
