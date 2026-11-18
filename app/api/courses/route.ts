import { connection } from "next/server";
import type { NextRequest } from "next/server";
import { findCourses } from "@/features/courses/course-catalogue";
import { readCourseQuery } from "@/features/courses/course-model";

export async function GET(request: NextRequest) {
  await connection();
  const headers = { "Cache-Control": "no-store" };
  try {
    return Response.json(await findCourses(readCourseQuery(request.nextUrl.searchParams)), { headers });
  } catch (error) {
    console.error("Could not load courses:", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: "Could not load courses. Please try again." }, { status: 503, headers });
  }
}
