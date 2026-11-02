import { connection } from "next/server";
import { getClasses } from "@/features/dashboard/classes-service";
import ClassSearch from "./ClassSearch";

async function loadClasses() {
  await connection();

  let classes;
  try {
    classes = await getClasses();
  } catch (error) {
    console.error("Could not load classes:", error instanceof Error ? error.name : "UnknownError");
    return null;
  }

  return classes;
}

export default function Dashboard() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold">FindMyStudents</p>
        <h1 className="mt-2 text-3xl font-bold">Baruch classes</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">
          Search for courses from Baruch College.
        </p>
      </header>
      <ClassSearch classesPromise={loadClasses()} />
    </section>
  );
}
