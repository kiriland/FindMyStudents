import AuthProvider from "@/features/auth/components/AuthProvider";
import type { Metadata } from "next";
import { Suspense } from "react";
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
        <AuthProvider>
          {/* Navbar reads usePathname(), which suspends while prerendering
              routes with dynamic params such as /students/[id]. */}
          <Suspense>
            <Navbar />
          </Suspense>
          {children}
          {modal}
        </AuthProvider>
      </body>
    </html>
  );
}
