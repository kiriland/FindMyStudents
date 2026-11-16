"use client";

import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Note from "@/components/ui/Note";
import EmptyState from "@/components/ui/EmptyState";

import { useState } from "react";
import type { Volunteer } from "../volunteers";
import Dialog from "@/components/ui/Dialog";

export default function VolunteerList({
  volunteers,
  courseCode,
}: {
  volunteers: Volunteer[];
  courseCode: string;
}) {
  const [selected, setSelected] = useState<Volunteer | null>(null);
  return (
    <section className="mt-7.5" aria-labelledby="volunteers-heading">
      <div className="flex items-center justify-between gap-3">
        <h2
          className="text-[21px] font-[650] tracking-[-.025em]"
          id="volunteers-heading"
        >
          Students offering to help
        </h2>
        <Badge tone="demo">Demo profiles</Badge>
      </div>
      <Note>
        These fictional profiles preview the experience. They are not real
        offers of help.
      </Note>
      {volunteers.length === 0 ? (
        <EmptyState
          title="No volunteers yet"
          description={`There are no demo volunteers for ${courseCode}. You can still explore the course details above.`}
        ></EmptyState>
      ) : (
        <ul className="grid list-none gap-3.5 p-0">
          {volunteers.map((volunteer) => (
            <li key={volunteer.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-start gap-4 rounded-xl border border-zinc-200 dark:border-[#303036] p-5 text-left hover:border-indigo-300 hover:bg-zinc-50 dark:hover:border-[#303036] dark:hover:bg-zinc-900 max-[640px]:gap-3 max-[640px]:p-4"
                onClick={() => setSelected(volunteer)}
                aria-haspopup="dialog"
              >
                <Avatar initials={volunteer.initials} />
                <span>
                  <span className="mb-1.25 block font-[650]">
                    {volunteer.name}
                  </span>
                  <span className="block text-sm leading-[1.6] text-zinc-500 dark:text-zinc-400">
                    {volunteer.introduction}
                  </span>
                  <span className="mt-2.5 block text-[13px] leading-[1.6] text-indigo-700 dark:text-indigo-300">
                    {volunteer.help}
                  </span>
                  <span className="mt-3 block text-xs font-semibold">
                    View demo profile ↗
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <Dialog
          title={`Demo profile: ${selected.name}`}
          onDismiss={() => setSelected(null)}
        >
          <Badge tone="demo">Fictional demo profile</Badge>
          <div className="mt-4.5 mb-6 flex items-center gap-4">
            <Avatar initials={selected.initials} />
            <h2 className="text-2xl font-bold">{selected.name}</h2>
          </div>
          <p className="text-[15px] leading-[1.75] whitespace-pre-line text-zinc-600 dark:text-zinc-300">
            {selected.biography}
          </p>
          <section className="mt-6 rounded-[10px] bg-zinc-50 p-5 dark:bg-zinc-900">
            <h3 className="mb-2 font-[650]">Help with {courseCode}</h3>
            <p className="text-sm leading-[1.7] text-zinc-600 dark:text-zinc-300">
              {selected.help}
            </p>
          </section>
          <Note>
            Real student profiles and ways to connect are coming later. This
            sample person cannot be contacted.
          </Note>
        </Dialog>
      )}
    </section>
  );
}
