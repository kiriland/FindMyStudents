/** The path of a student's Profile page. */
export function profileHref(studentId: string) {
  return `/students/${encodeURIComponent(studentId)}`;
}
