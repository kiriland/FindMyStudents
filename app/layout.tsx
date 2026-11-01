import AmplifyProvider from "@/components/AmplifyProvider";
import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
