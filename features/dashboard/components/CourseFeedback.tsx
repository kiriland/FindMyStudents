import Link from "next/link";

export function CourseLoading() {
  return <p role="status" className="mt-[9px] mb-5 text-[13px] leading-[1.6] text-zinc-500 dark:text-zinc-400">Loading course details…</p>;
}

export function CourseNotFound() {
  return <div className="rounded-[14px] border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-600 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:mb-5.5 [&_p]:leading-[1.6] [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400"><h1>Course not found</h1><p>This course is not in the current catalogue.</p><Link className="inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-[9px] text-sm font-semibold text-inherit no-underline enabled:hover:bg-zinc-100 [&:is(a):hover]:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:enabled:hover:bg-zinc-800 dark:[&:is(a):hover]:bg-zinc-800" href="/dashboard">Browse courses</Link></div>;
}
