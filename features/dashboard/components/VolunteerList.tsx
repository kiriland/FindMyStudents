"use client";

import { useState } from "react";
import type { Volunteer } from "../volunteers";
import Dialog from "./Dialog";

export default function VolunteerList({ volunteers, courseCode }: { volunteers: Volunteer[]; courseCode: string }) {
  const [selected, setSelected] = useState<Volunteer | null>(null);
  return (
    <section className="mt-7.5" aria-labelledby="volunteers-heading">
      <div className="flex items-center justify-between gap-3 [&_h2]:text-[21px] [&_h2]:font-[650] [&_h2]:tracking-[-.025em]"><h2 id="volunteers-heading">Students offering to help</h2><span className="inline-block rounded-md bg-orange-50 px-2 py-1.25 text-[11px] font-[650] whitespace-nowrap text-orange-800 dark:bg-[#422006] dark:text-orange-200">Demo profiles</span></div>
      <p className="mt-[9px] mb-5 text-[13px] leading-[1.6] text-zinc-500 dark:text-zinc-400">These fictional profiles preview the experience. They are not real offers of help.</p>
      {volunteers.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-600 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2.5 [&_p]:mb-5.5 [&_p]:leading-[1.6] [&_p]:text-zinc-500 dark:[&_p]:text-zinc-400"><h2>No volunteers yet</h2><p>There are no demo volunteers for {courseCode}. You can still explore the course details above.</p></div>
      ) : (
        <ul className="grid list-none gap-3.5 p-0">
          {volunteers.map((volunteer) => (
            <li key={volunteer.id}>
              <button type="button" className="flex w-full cursor-pointer items-start gap-4 rounded-xl border border-zinc-200 dark:border-[#303036] p-5 text-left hover:border-indigo-300 hover:bg-zinc-50 dark:hover:border-[#303036] dark:hover:bg-zinc-900 max-[640px]:gap-3 max-[640px]:p-4" onClick={() => setSelected(volunteer)} aria-haspopup="dialog">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-[#252348] dark:text-indigo-200" aria-hidden="true">{volunteer.initials}</span>
                <span><span className="mb-1.25 block font-[650]">{volunteer.name}</span><span className="block text-sm leading-[1.6] text-zinc-500 dark:text-zinc-400">{volunteer.introduction}</span><span className="mt-2.5 block text-[13px] leading-[1.6] text-indigo-700 dark:text-indigo-300">{volunteer.help}</span><span className="mt-3 block text-xs font-semibold">View demo profile ↗</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <Dialog title={`Demo profile: ${selected.name}`} onDismiss={() => setSelected(null)}>
          <span className="inline-block rounded-md bg-orange-50 px-2 py-1.25 text-[11px] font-[650] whitespace-nowrap text-orange-800 dark:bg-[#422006] dark:text-orange-200">Fictional demo profile</span>
          <div className="mt-4.5 mb-6 flex items-center gap-4 [&_h2]:text-2xl [&_h2]:font-bold"><span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-[#252348] dark:text-indigo-200" aria-hidden="true">{selected.initials}</span><h2>{selected.name}</h2></div>
          <p className="text-[15px] leading-[1.75] whitespace-pre-line text-zinc-600 dark:text-zinc-300">{selected.biography}</p>
          <section className="mt-6 rounded-[10px] bg-zinc-50 p-5 dark:bg-zinc-900 [&_h3]:mb-2 [&_h3]:font-[650] [&_p]:text-sm [&_p]:leading-[1.7] [&_p]:text-zinc-600 dark:[&_p]:text-zinc-300"><h3>Help with {courseCode}</h3><p>{selected.help}</p></section>
          <p className="mt-[9px] mb-5 text-[13px] leading-[1.6] text-zinc-500 dark:text-zinc-400">Real student profiles and ways to connect are coming later. This sample person cannot be contacted.</p>
        </Dialog>
      )}
    </section>
  );
}
