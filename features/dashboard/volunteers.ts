import "server-only";
import { courseCodeKey, SCHOOL } from "./course-model";
import type { Course } from "./course-model";

export type Volunteer = {
  id: string;
  name: string;
  initials: string;
  introduction: string;
  biography: string;
  help: string;
};

const profiles = {
  maya: {
    id: "demo-maya", name: "Maya Chen", initials: "MC",
    introduction: "I like turning tricky technical ideas into small, practical examples.",
    biography: "I’m a fictional student profile showing what course help could look like here. My approach is to work through an example together, explain the reasoning, and leave you with a way to practice independently.",
  },
  jordan: {
    id: "demo-jordan", name: "Jordan Rivera", initials: "JR",
    introduction: "Happy to work through concepts step by step and compare approaches.",
    biography: "This is a fictional demo profile. I enjoy study groups where everyone can ask questions, share how they approached a problem, and build confidence with the fundamentals before moving on.",
  },
  sam: {
    id: "demo-sam", name: "Sam Patel", initials: "SP",
    introduction: "I learn best by building things and explaining how they work.",
    biography: "I’m a sample profile for exploring FindMyStudents. In a real profile, this space could describe a student’s background and how they prefer to help. The course-specific note below shows where that help applies.",
  },
};

const assignments: Record<string, { profileId: keyof typeof profiles; help: string }[]> = {
  CIS3400: [
    { profileId: "maya", help: "SQL queries, joins, and translating an ER diagram into a relational schema." },
    { profileId: "jordan", help: "Database normalization and working through database-design practice problems." },
  ],
  CIS4160: [
    { profileId: "sam", help: "JavaScript fundamentals, web application structure, and understanding request/response flows." },
    { profileId: "maya", help: "Connecting a web application to a database and explaining SQL-backed features." },
  ],
  MTH2003: [
    { profileId: "jordan", help: "Algebra fundamentals and breaking practice problems into manageable steps." },
  ],
};

// Replace this provider with real profile storage later; catalogue caching is separate.
export async function getVolunteers(course: Pick<Course, "school" | "courseCode">): Promise<Volunteer[]> {
  if (course.school !== SCHOOL.name) return [];
  const code = courseCodeKey(course.courseCode);
  return (assignments[code] ?? []).map(({ profileId, help }) => ({ ...profiles[profileId], help }));
}
