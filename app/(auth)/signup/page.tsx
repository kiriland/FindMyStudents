import { Suspense } from "react";
import SignUpForm from "@/features/auth/components/SignupForm";

export default function SignUpPage() {
  return (
    <Suspense fallback={<p role="status">Loading form...</p>}>
      <SignUpForm />
    </Suspense>
  );
}
