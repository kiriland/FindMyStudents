import { Suspense } from "react";
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<p role="status">Loading form...</p>}>
      <LoginForm />
    </Suspense>
  );
}
