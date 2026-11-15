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
      <body className="flex min-h-full flex-col bg-white font-[Arial,Helvetica,sans-serif] text-[#171717] dark:bg-[#0a0a0a] dark:text-[#ededed]">
        <AmplifyProvider>
          <Navbar />
          {children}
          {modal}
        </AmplifyProvider>
      </body>
    </html>
  );
}
