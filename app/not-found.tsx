import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { discoveryHref } from "@/features/courses/course-model";

export default function NotFound() {
  return (
    <main id="main" className="wrap flex w-full flex-1 items-center py-20">
      <div className="mx-auto max-w-[520px] text-center">
        <p className="font-display text-[clamp(64px,12vw,120px)] leading-none font-semibold tracking-[-0.05em] text-brand-100">404</p>
        <h1 className="mt-2 font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.03em]">This page isn’t here</h1>
        <p className="mx-auto mt-3 mb-7 max-w-[40ch] text-[17px] text-muted">The link may be old or mistyped. Try searching for a course instead.</p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Link href={discoveryHref()} className={buttonClass()}>Browse courses</Link>
          <Link href="/" className={buttonClass({ variant: "secondary" })}>Go home</Link>
        </div>
      </div>
    </main>
  );
}

export const metadata: Metadata = { title: "Page not found" };
