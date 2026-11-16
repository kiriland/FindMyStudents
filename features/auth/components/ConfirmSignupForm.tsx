"use client";

import Button from "@/components/Button";
import { FieldLabel, Input } from "@/components/ui/FormControls";
import AuthForm from "./AuthForm";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmEmailSignup } from "@/features/auth/auth-client";

export default function ConfirmSignupForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value);
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const result = await confirmEmailSignup(email, code);

      if (result.isSignUpComplete) {
        router.push("/login");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <AuthForm title="Confirm Sign Up" onSubmit={handleConfirm}>
      <FieldLabel variant="auth" htmlFor="email">
        Email
      </FieldLabel>
      <Input
        variant="auth"
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      <FieldLabel variant="auth" htmlFor="code">
        Verification Code
      </FieldLabel>
      <Input
        variant="auth"
        type="text"
        id="code"
        value={code}
        onChange={handleCodeChange}
        required
      />

      <Button variant="auth" type="submit">
        Verify Email
      </Button>
      {error && <p>{error}</p>}
    </AuthForm>
  );
}
