import "server-only";
import { getCatalogue } from "@/features/courses/course-catalogue";
import { getDepartment } from "@/features/courses/course-model";

// Shown first when the catalogue has them; the rest sit behind "Show all".
const FEATURED = ["ACC", "CIS", "ECO", "FIN", "MTH", "STA", "MKT", "MGT", "ENG", "PSY", "LAW", "COM"];

export type DepartmentIndex = { featured: string[]; rest: string[] };

/** The catalogue's department codes, split into featured and the rest. Null when the catalogue can't be read. */
export async function getDepartmentIndex(): Promise<DepartmentIndex | null> {
  try {
    const courses = await getCatalogue();
    const all = [...new Set(courses.map((course) => getDepartment(course.courseCode)))].filter(Boolean).sort();
    const featured = FEATURED.filter((code) => all.includes(code));
    const shown = featured.length ? featured : all.slice(0, FEATURED.length);
    return { featured: shown, rest: all.filter((code) => !shown.includes(code)) };
  } catch (error) {
    console.error("Could not load departments:", error instanceof Error ? error.name : "UnknownError");
    return null;
  }
}
