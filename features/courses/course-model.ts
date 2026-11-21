export const SCHOOL = { name: "Baruch College", slug: "baruch" };
export const PAGE_SIZE = 20;
export const DISCOVERY_PATH = "/dashboard";
// The course view's main heading; the course modal uses it as its accessible name.
export const COURSE_HEADING_ID = "course-heading";

export interface Course {
  school: string;
  courseCode: string;
  title: string;
  description: string;
  sourceUrl: string;
}
export interface CourseQuery {
  search: string;
  department: string;
  page: number;
}
export const EMPTY_QUERY: CourseQuery = { search: "", department: "", page: 1 };
export type CourseSummary = Pick<Course, "school" | "courseCode" | "title"> & {
  preview: string;
};
export interface CoursePage {
  courses: CourseSummary[];
  departments: string[];
  total: number;
  catalogueTotal: number;
  pageCount: number;
  query: CourseQuery;
}

export function getDepartment(code: string) {
  return /^[a-z]+/i.exec(code.trim())?.[0].toUpperCase() ?? "";
}

export function readCourseQuery(
  params: Pick<URLSearchParams, "get">,
): CourseQuery {
  const value = params.get("page") ?? "1";
  const page = /^\d+$/.test(value) ? Number(value) : 1;
  return {
    search: (params.get("q") ?? "").slice(0, 300).trim(),
    department: (params.get("department") ?? "")
      .replaceAll(/[^a-z]/gi, "")
      .slice(0, 12)
      .toUpperCase(),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function queryString(query: CourseQuery) {
  const params = new URLSearchParams();
  if (query.search) {
    params.set("q", query.search);
  }
  if (query.department) {
    params.set("department", query.department);
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }
  return params.toString();
}

export function withQuery(path: string, params: string) {
  return params ? `${path}?${params}` : path;
}

/** One page of matching Courses from the courses API. For the browser; the server calls `findCourses`. */
export async function fetchCoursePage(
  params: string,
  signal: AbortSignal,
): Promise<CoursePage> {
  const response = await fetch(withQuery("/api/courses", params), {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not load courses.");
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- our own /api/courses route builds this response from a CoursePage.
  return response.json() as Promise<CoursePage>;
}

export function discoveryHref(query: CourseQuery = EMPTY_QUERY) {
  return withQuery(DISCOVERY_PATH, queryString(query));
}

export function courseCodeKey(code: string) {
  return code.toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
}

export function courseHref(course: Pick<Course, "courseCode">) {
  return `/courses/${SCHOOL.slug}/${courseCodeKey(course.courseCode)}`;
}
