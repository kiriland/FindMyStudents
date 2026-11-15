import "server-only";
import { db } from "@/lib/dynamodb";
import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { getDepartment, PAGE_SIZE, SCHOOL } from "./course-model";
import type { Course, CoursePage, CourseQuery } from "./course-model";

const CATALOGUE_TTL = 60 * 60 * 1000;
let catalogue: { courses: Course[]; expiresAt: number } | undefined;
let loading: Promise<Course[]> | undefined;

async function readCatalogue(): Promise<Course[]> {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error("DYNAMODB_TABLE_NAME is not set.");
  }

  const courses: Course[] = [];
  for await (const page of paginateQuery({ client: db }, {
    TableName: tableName,
    KeyConditionExpression: "#school = :school",
    ExpressionAttributeNames: { "#school": "school", "#code": "courseCode", "#title": "title", "#description": "description", "#source": "sourceUrl" },
    ExpressionAttributeValues: { ":school": SCHOOL.name },
    ProjectionExpression: "#school, #code, #title, #description, #source",
  })) {
    for (const item of page.Items ?? []) {
      if (item.school !== SCHOOL.name || typeof item.courseCode !== "string" || typeof item.title !== "string"
        || typeof item.description !== "string" || typeof item.sourceUrl !== "string") continue;
      courses.push({ school: item.school, courseCode: item.courseCode, title: item.title || item.courseCode, description: item.description, sourceUrl: item.sourceUrl });
    }
  }
  return courses;
}

export async function getClasses(): Promise<Course[]> {
  // Hard runtime-local expiry: await fresh data instead of serving stale rows.
  if (catalogue && Date.now() < catalogue.expiresAt) return catalogue.courses;
  if (!loading) {
    const startedAt = Date.now();
    loading = readCatalogue().then((courses) => {
      catalogue = { courses, expiresAt: startedAt + CATALOGUE_TTL };
      return courses;
    }).finally(() => { loading = undefined; });
  }
  return loading;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/([a-z])(\d)/g, "$1 $2").replace(/[^a-z0-9]+/g, " ").trim();
}

export async function findCourses(query: CourseQuery): Promise<CoursePage> {
  const courses = await getClasses();
  const departments = [...new Set(courses.map((course) => getDepartment(course.courseCode)))].filter(Boolean).sort();
  const subjects = new Set(departments.map((department) => department.toLowerCase()));
  const text = normalize(query.search);
  const words = text.split(/\s+/).filter(Boolean);
  const matches = courses.flatMap((course) => {
    const code = normalize(course.courseCode);
    const number = code.match(/\d+/)?.[0] ?? "";
    const subject = getDepartment(course.courseCode);
    const title = normalize(course.title);
    const description = normalize(course.description);
    if (query.department && subject !== query.department) return [];
    if (!text && query.search) return [];
    if (!words.every((word) => {
      if (/^\d+$/.test(word)) return number.startsWith(word);
      if (subjects.has(word)) return subject.toLowerCase() === word;
      return code.includes(word) || title.includes(word) || description.includes(word);
    })) return [];
    let rank = 5;
    if (!text || code.replace(/ /g, "") === text.replace(/ /g, "")) rank = 0;
    else if (number === text) rank = 1;
    else if (words.every((word) => code.includes(word))) rank = 2;
    else if (title.includes(text)) rank = 3;
    else if (words.every((word) => title.includes(word))) rank = 4;
    return [{ course, rank }];
  }).sort((a, b) => a.rank - b.rank || a.course.courseCode.localeCompare(b.course.courseCode, undefined, { numeric: true }));

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  return {
    courses: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(({ course }) => ({
      school: course.school, courseCode: course.courseCode, title: course.title,
      preview: course.description.length > 180 ? `${course.description.slice(0, 177).trimEnd()}…` : course.description,
    })),
    departments, total: matches.length, catalogueTotal: courses.length, pageCount, query: { ...query, page },
  };
}

export async function getCourse(school: string, code: string) {
  if (school !== SCHOOL.slug) return null;
  const key = normalize(code).replace(/ /g, "");
  return (await getClasses()).find((course) => normalize(course.courseCode).replace(/ /g, "") === key) ?? null;
}
