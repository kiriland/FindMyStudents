import type { Metadata } from "next";
import { Lexend, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PendingRequestsBadge from "@/features/profiles/components/PendingRequestsBadge";

// Lexend for headings and interface text, Source Sans 3 for reading.
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FindMyStudents", template: "%s | FindMyStudents" },
  description: "Find Baruch College students who offer help with your courses.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lexend.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <a
          href="#main"
          className="sr-only rounded-ctl bg-surface px-4 py-3 font-display font-medium text-brand-strong shadow-float focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        {/* Navbar reads usePathname(), which suspends while prerendering
            routes with dynamic params such as /students/[id]. */}
        <Suspense fallback={<div aria-hidden="true" className="h-[68px]" />}>
          <Navbar profileBadge={<Suspense><PendingRequestsBadge /></Suspense>} />
        </Suspense>
        {children}
        <Footer />
        {modal}
      </body>
    </html>
  );
}
