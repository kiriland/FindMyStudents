import PageContainer from "@/components/ui/PageContainer";
import { Suspense } from "react";
import ClassSearch from "./ClassSearch";

export default function Dashboard() {
  return (
    <PageContainer>
      <header className="mb-7.5">
        <p className="mb-3 text-xs font-bold tracking-[.12em] text-indigo-500 uppercase dark:text-indigo-300">
          Baruch College
        </p>
        <h1 className="text-[clamp(32px,5vw,46px)] leading-[1.15] font-bold tracking-[-.045em]">
          Find your course.
        </h1>
        <p className="mt-3.5 text-base text-zinc-500 dark:text-zinc-400">
          Explore courses and find students offering to help.
        </p>
      </header>
      <Suspense fallback={<p role="status">Loading course search…</p>}>
        <ClassSearch />
      </Suspense>
    </PageContainer>
  );
}
