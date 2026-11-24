import type { Metadata } from "next";

import Dashboard from "@/features/courses/components/Dashboard";

export default function DashboardPage() {
  return <Dashboard />;
}

export const metadata: Metadata = { title: "Courses" };
