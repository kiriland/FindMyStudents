import type { Metadata } from "next";

import ConfirmResetPasswordForm from "@/features/auth/components/ConfirmResetPassword";

export default function ConfirmSignupPage() {
  return <ConfirmResetPasswordForm />;
}

export const metadata: Metadata = { title: "Confirm reset password" };
