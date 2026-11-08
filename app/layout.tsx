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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
        <AmplifyProvider>
          <Navbar />
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
