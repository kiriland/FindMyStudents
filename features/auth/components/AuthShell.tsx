import type { ReactNode } from "react";

const TEXTURE =
  "ACC CIS ECO FIN MTH STA MKT MGT ENG PSY LAW COM ACC CIS ECO FIN MTH STA".split(
    " ",
  );

/** Step `current` of a two-step flow, as two bars and a label. */
export function Stepper({ current }: { current: 1 | 2 }) {
  return (
    <p className="mb-4 flex items-center gap-2.5 font-display text-[13px] leading-none font-medium text-subtle">
      <span aria-hidden="true" className="flex gap-1">
        <i className="block h-1 w-7 rounded-full bg-brand" />
        <i
          className={`block h-1 w-7 rounded-full ${current === 2 ? "bg-brand" : "bg-line-strong"}`}
        />
      </span>
      Step {current} of 2
    </p>
  );
}

/**
 * The frame for every auth page: the form on the left and, on wide screens,
 * a light blue panel on the right that previews what the account is for.
 */
export default function AuthShell({
  title,
  subtitle,
  step,
  aside,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  step?: 1 | 2;
  aside: { heading: string; text: string; visual: ReactNode };
  children: ReactNode;
}) {
  return (
    <div className="wrap py-[clamp(24px,5vw,64px)]">
      <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-14">
        <section
          aria-labelledby="auth-title"
          className="mx-auto w-full max-w-[440px] animate-fade-up py-2 lg:mx-0 lg:py-8"
        >
          {step && <Stepper current={step} />}
          <h1
            id="auth-title"
            className="font-display text-[clamp(30px,4vw,40px)] leading-[1.08] font-semibold tracking-[-0.035em]"
          >
            {title}
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">
            {subtitle}
          </p>
          <div className="mt-7">{children}</div>
        </section>
        <aside
          aria-hidden="true"
          className="relative hidden min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-brand-100 bg-brand-50 p-12 lg:flex"
        >
          <div className="pointer-events-none absolute -inset-[10%] flex -rotate-6 flex-wrap content-center gap-x-6 font-display text-[88px] leading-none font-semibold tracking-[-0.04em] text-brand/5 select-none">
            {TEXTURE.map((code, index) => (
              <span key={index}>{code}</span>
            ))}
          </div>
          <div className="relative">
            <h2 className="font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.03em] text-navy">
              {aside.heading}
            </h2>
            <p className="mt-3 max-w-[40ch] text-[17px] leading-relaxed text-ink-2">
              {aside.text}
            </p>
          </div>
          <div className="relative mt-auto pt-10">{aside.visual}</div>
        </aside>
      </div>
    </div>
  );
}

/** A course card as a small illustration, using a real catalogue course. */
export function SampleCourseCard({
  code,
  title,
  className = "",
}: {
  code: string;
  title: string;
  className?: string;
}) {
  const [department, number] = code.split(" ");
  return (
    <div
      className={`grid w-[340px] grid-cols-[78px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line bg-surface shadow-float ${className}`}
    >
      <span className="flex flex-col justify-between gap-6 border-r border-brand-100 bg-brand-50 px-3.5 py-4">
        <span className="font-display text-lg leading-none font-semibold text-brand-strong">
          {department}
        </span>
        <span className="font-display text-2xl leading-none tracking-[-0.03em] text-ink">
          {number}
        </span>
      </span>
      <span className="flex items-center px-4 py-4 font-display text-base leading-snug font-semibold">
        {title}
      </span>
    </div>
  );
}
