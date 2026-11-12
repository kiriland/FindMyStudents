
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { getClasses } from "@/features/dashboard/classes-service";
import ClassSearch from "./ClassSearch";

async function loadClasses() {
  await connection();

  let classes;

  try {
    classes = await getClasses();
  } catch (error) {
    console.error(
      "Could not load classes:",
      error instanceof Error ? error.name : "UnknownError"
    );

    return null;
  }

  return classes;
}

export default function Dashboard() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-zinc-900">

      {/* DASHBOARD HERO */}
      <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50">

        {/* Decorative Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20">

          {/* Header Text */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              FindMyStudents Dashboard
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              Find your next class.
              <span className="mt-2 block text-blue-600">
                Start connecting.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-600 sm:text-lg">
              Explore Baruch College courses, search for your
              favorite subjects, and discover opportunities
              to connect with fellow students.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#explore-classes"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Explore Classes
                <span aria-hidden="true" className="ml-2">
                  ↓
                </span>
              </a>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Dashboard Branding Card */}
          <div className="hidden lg:block">
            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/50">

              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Your Student Community
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Baruch College
                </span>
              </div>

              <div className="flex justify-center rounded-2xl bg-blue-50 p-8">
                <Image
                  src="/findmystudents-logo.png"
                  alt="FindMyStudents"
                  width={400}
                  height={160}
                  className="h-auto w-full max-w-xs object-contain"
                  priority
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-blue-700">
                    Discover
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Classes
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-blue-700">
                    Connect
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Students
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-blue-700">
                    Succeed
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Together
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* COURSE DIRECTORY */}
      <section
        id="explore-classes"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16"
      >

        {/* Section Heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-600">
              Course Directory
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Explore Baruch Classes
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              Search the available course catalog by course
              code, class name, or subject.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z"
              />
            </svg>
            Browse Courses
          </div>
        </div>

        {/* EXISTING AWS-POWERED CLASS SEARCH */}
        <ClassSearch classesPromise={loadClasses()} />

      </section>

      {/* HELP SECTION */}
      <section className="border-t border-zinc-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-10">
            <div className="grid items-center gap-8 md:grid-cols-2">

              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-600">
                  Need Some Guidance?
                </p>

                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Your academic connections start here.
                </h2>

                <p className="mt-4 leading-7 text-zinc-600">
                  Start by searching for a course you are taking
                  or interested in. FindMyStudents is designed
                  to help students discover opportunities to
                  connect and collaborate.
                </p>

                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  Learn more about FindMyStudents
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                    1
                  </span>
                  <p className="text-sm font-medium text-zinc-700">
                    Search for your course
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                    2
                  </span>
                  <p className="text-sm font-medium text-zinc-700">
                    Explore available class information
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                    3
                  </span>
                  <p className="text-sm font-medium text-zinc-700">
                    Discover opportunities to connect
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
