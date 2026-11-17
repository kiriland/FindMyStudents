
import { Suspense } from "react";
import AmplifyProvider from "@/components/AmplifyProvider";
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FindMyStudents",
  description: "Browse sample Baruch College courses.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-zinc-900">
        <AmplifyProvider>
          <Suspense fallback={<div className="h-[70px] border-b border-zinc-200" aria-hidden="true" />}>
            <Navbar />
          </Suspense>
          {children}
          {modal}
        </AmplifyProvider>
      </body>
    </html>
  );
}
