"use client";

import "@/lib/amplify";

// Initializes that configuration within your client-side application
export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}