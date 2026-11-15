import { Suspense } from "react";
import ClassSearch from "./ClassSearch";

export default function Dashboard() {
  return (
    <main className="mx-auto w-full max-w-[960px] px-6 pt-14 pb-18 max-[640px]:px-4.5 max-[640px]:pt-8 max-[640px]:pb-12 [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-indigo-500 [&_a:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-indigo-500 [&_button:focus-visible]:outline-offset-3 [&_input:focus-visible]:outline-3 [&_input:focus-visible]:outline-indigo-500 [&_input:focus-visible]:outline-offset-3 [&_select:focus-visible]:outline-3 [&_select:focus-visible]:outline-indigo-500 [&_select:focus-visible]:outline-offset-3">
      <header className="mb-7.5 [&_h1]:text-[clamp(32px,5vw,46px)] [&_h1]:font-bold [&_h1]:tracking-[-.045em] [&_h1]:leading-[1.15] [&>p:last-child]:mt-3.5 [&>p:last-child]:text-base [&>p:last-child]:text-zinc-500 dark:[&>p:last-child]:text-zinc-400">
        <p className="mb-3 text-xs font-bold tracking-[.12em] text-indigo-500 uppercase dark:text-indigo-300">Baruch College</p>
        <h1>Find your course.</h1>
        <p>Explore courses and find students offering to help.</p>
      </header>
      <Suspense fallback={<p role="status">Loading course search…</p>}><ClassSearch /></Suspense>
    </main>
  );
}
