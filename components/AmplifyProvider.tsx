"use client";

import "@/lib/amplify";
import AuthProvider from "@/features/auth/components/AuthProvider";

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
