"use client";

import { useState } from "react";
import { FAQ } from "../faq";
import { H2, LEDE } from "../styles";

const CHIP =
  "cursor-pointer rounded-full border px-3 py-[7px] font-display text-sm leading-none font-medium transition-colors duration-150";

/** Questions grouped by topic, with a filter. Every group is in the page; the filter only hides the others. */
export default function Faq() {
  const [topic, setTopic] = useState("all");
  const topics = [{ id: "all", title: "All" }, ...FAQ];

  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line bg-surface py-[clamp(64px,9vw,104px)]">
      <div className="wrap grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="reveal self-start lg:sticky lg:top-[100px]">
          <h2 id="faq-title" className={H2}>Questions</h2>
          <p className={LEDE}>About searching, accounts, Help Offers, profiles and privacy.</p>
          <div role="group" aria-label="Filter questions" className="mt-[22px] flex flex-wrap gap-1.5">
            {topics.map(({ id, title }) => (
              <button
                key={id}
                type="button"
                aria-pressed={topic === id}
                onClick={() => setTopic(id)}
                className={`${CHIP} ${
                  topic === id
                    ? "border-brand-200 bg-brand-50 text-brand-strong"
                    : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>

        <div>
          {FAQ.map((group, index) => (
            <div key={group.id} hidden={topic !== "all" && topic !== group.id} className={index && topic === "all" ? "mt-9" : ""}>
              <h3 className="mb-1 font-display text-sm leading-none font-medium text-subtle">{group.title}</h3>
              {group.items.map((item) => (
                <details key={item.question} className="group details-smooth border-b border-line">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 py-[18px] font-display text-lg leading-[1.35] font-medium tracking-[-0.01em] transition-colors duration-150 group-open:text-brand-strong hover:text-brand-strong">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="relative size-[18px] flex-none transition-transform duration-250 ease-soft group-open:rotate-45 before:absolute before:inset-x-0 before:top-2 before:h-0.5 before:rounded-[1px] before:bg-current before:content-[''] after:absolute after:inset-x-0 after:top-2 after:h-0.5 after:rotate-90 after:rounded-[1px] after:bg-current after:content-['']"
                    />
                  </summary>
                  <p className="max-w-[62ch] pb-5 text-[17px] leading-relaxed text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
