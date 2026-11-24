import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { discoveryHref } from "@/features/courses/course-model";

import { ID_CARD, PROFILE_GRID } from "./profile-styles";

/** A placeholder in the shape of a Profile while it loads. */
export function ProfileLoading() {
  return (
    <div role="status" aria-label="Loading profile" className={PROFILE_GRID}>
      <div className={ID_CARD}>
        <span className="shimmer size-[96px] rounded-full bg-well sm:size-[120px]" />
        <span className="h-8 w-2/3 rounded-lg bg-well" />
        <span className="h-4 w-1/2 rounded-md bg-well" />
      </div>
      <div className="flex flex-col gap-4">
        <span className="h-6 w-32 rounded-lg bg-well" />
        <span className="h-4 w-full max-w-[62ch] rounded-md bg-well" />
        <span className="h-4 w-11/12 max-w-[58ch] rounded-md bg-well" />
        <span className="h-4 w-2/3 rounded-md bg-well" />
      </div>
    </div>
  );
}

export function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-[520px] rounded-panel border border-line bg-surface px-7 py-12 text-center">
      <h1 className="font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.03em]">
        Profile not found
      </h1>
      <p className="mx-auto mt-3 mb-6 max-w-[40ch] text-[17px] text-muted">
        No student has this profile link. Check that the link is complete.
      </p>
      <Link className={buttonClass()} href={discoveryHref()}>
        Browse courses
      </Link>
    </div>
  );
}
