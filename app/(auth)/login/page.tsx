import type { Metadata } from "next";

import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}

export const metadata: Metadata = { title: "Log in" };
