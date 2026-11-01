import { Suspense } from "react";
import { connection } from "next/server";
import { getClasses } from "@/features/classes/classes-service";

async function ClassList() {
  await connection();

  let classes;
  try {
    classes = await getClasses();
  } catch (error) {
    console.error("Could not load classes:", error instanceof Error ? error.name : "UnknownError");
    return (
      <p role="alert" className="rounded-lg border border-red-300 p-4">
        Could not load classes. Try refreshing the page.
      </p>
    );
  }

  if (classes.length === 0) {
    return <p>No classes have been added yet.</p>;
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {classes.map((course) => (
        <li key={course.courseCode} className="rounded-lg border border-zinc-300 p-6 dark:border-zinc-700">
          <p className="text-sm font-semibold">{course.courseCode} · {course.credits} credits</p>
          <h2 className="mt-2 text-xl font-semibold">{course.title}</h2>
          <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">{course.description}</p>
          <a className="mt-5 inline-block underline underline-offset-4" href={course.sourceUrl}>
            Baruch catalog
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Classes() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold">FindMyStudents</p>
        <h1 className="mt-2 text-3xl font-bold">Baruch classes</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">
          Sample courses from Baruch College.
        </p>
      </header>
      <Suspense fallback={<p role="status">Loading classes...</p>}>
        <ClassList />
      </Suspense>
    </section>
  );
}
