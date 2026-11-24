import type { Metadata } from "next";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

export const metadata: Metadata = { title: "Reset your password" };
