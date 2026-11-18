import type { Metadata } from "next";
import ConfirmSignupForm from "@/features/auth/components/ConfirmSignupForm";

export default function ConfirmSignupPage() {
  return <ConfirmSignupForm />;
}

export const metadata: Metadata = { title: "Confirm your email" };
