import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { discoveryHref } from "@/features/courses/course-model";
import AccountCta from "./AccountCta";

const TEXTURE = "ACC CIS ECO FIN MTH STA MKT MGT ENG PSY LAW COM ".repeat(2).trim().split(" ");

/** A last invitation, on a blue panel textured with department codes. */
export default function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="py-[clamp(56px,8vw,96px)]">
      <div className="wrap">
        <div className="reveal relative overflow-hidden rounded-[28px] bg-brand-strong px-[clamp(24px,5vw,72px)] py-[clamp(36px,6vw,80px)] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[5%] -inset-y-[10%] flex -rotate-6 flex-wrap content-center gap-x-7 font-display text-[clamp(48px,7vw,96px)] leading-none font-semibold tracking-[-0.04em] text-white/6 select-none"
          >
            {TEXTURE.map((code, index) => <span key={index}>{code}</span>)}
          </div>
          <div className="relative max-w-[640px]">
            <h2 id="cta-title" className="font-display text-[clamp(30px,4.4vw,56px)] leading-[1.05] font-semibold tracking-[-0.04em]">
              Start with the course you’re taking right now.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-white/86">
              Searching is open to everyone. Create a free account to see who offers help, set up your profile and add
              your own Help Offers.
            </p>
            <div className="mt-[30px] flex flex-wrap gap-3">
              <Link href={discoveryHref()} className={buttonClass({ variant: "white", size: "lg", className: "max-sm:flex-1 max-sm:basis-full" })}>
                Browse courses
              </Link>
              <AccountCta signedInLabel="Add your Help Offers" variant="outline-white" size="lg" className="max-sm:flex-1 max-sm:basis-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
