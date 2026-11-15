export const SCHOOL = { name: "Baruch College", slug: "baruch" };
export const PAGE_SIZE = 20;

export type Course = { school: string; courseCode: string; title: string; description: string; sourceUrl: string };
export type CourseQuery = { search: string; department: string; page: number };
export type CourseSummary = Pick<Course, "school" | "courseCode" | "title"> & { preview: string };
export type CoursePage = {
  courses: CourseSummary[];
  departments: string[];
  total: number;
  catalogueTotal: number;
  pageCount: number;
  query: CourseQuery;
};

export function getDepartment(code: string) {
  return code.trim().match(/^[a-z]+/i)?.[0].toUpperCase() ?? "";
}

export function readCourseQuery(params: Pick<URLSearchParams, "get">): CourseQuery {
  const value = params.get("page") ?? "1";
  const page = /^\d+$/.test(value) ? Number(value) : 1;
  return {
    search: (params.get("q") ?? "").slice(0, 300).trim(),
    department: (params.get("department") ?? "").replace(/[^a-z]/gi, "").slice(0, 12).toUpperCase(),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function queryString(query: CourseQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("q", query.search);
  if (query.department) params.set("department", query.department);
  if (query.page > 1) params.set("page", String(query.page));
  return params.toString();
}

export function discoveryHref(query: CourseQuery = { search: "", department: "", page: 1 }) {
  const params = queryString(query);
  return `/dashboard${params ? `?${params}` : ""}`;
}

export function courseHref(course: Pick<Course, "courseCode">) {
  return `/courses/${SCHOOL.slug}/${encodeURIComponent(course.courseCode)}`;
}
