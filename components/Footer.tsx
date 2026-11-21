import Link from "next/link";

import Logo from "@/components/ui/Logo";
import { discoveryHref } from "@/features/courses/course-model";

const LINKS = [
  { href: discoveryHref(), label: "Courses" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "Questions" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface py-10">
      <div className="wrap flex flex-wrap justify-between gap-6">
        <div>
          <Logo />
          <p className="mt-2.5 max-w-[46ch] text-sm text-subtle">
            An independent student project for the Baruch College community. Not
            an official Baruch College service.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-1"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-1 font-semibold text-muted transition-colors duration-150 hover:text-brand-strong"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
