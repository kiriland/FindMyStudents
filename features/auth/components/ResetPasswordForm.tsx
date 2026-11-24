"use client";

// Configures Amplify before this form signs in.
import "@/lib/amplify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import Input from "@/components/Input";
import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import Field, { FormAlert, Spinner } from "@/components/ui/Field";
import { handleResetPassword_Amplify } from "@/features/auth/auth-client";
import {
  currentReturnTo,
  keepReturnTo,
} from "@/features/auth/return-to-browser";

import type { TurnstileInstance } from "./AuthChallenge";

import AuthChallenge, { getChallengeToken } from "./AuthChallenge";
import AuthShell, { SampleCourseCard } from "./AuthShell";
import PasswordInput from "./PasswordInput";
import TurnstileNote from "./TurnstileNote";

export default function ResetPasswordForm() {
  const challenge = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleResetPassword(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting.current) {
      return;
    }

    submitting.current = true;
    setError("");
    setLoading(true);

    let token: string | undefined;

    try {
      token = getChallengeToken(challenge.current);
    
      await handleResetPassword_Amplify(email)

      router.push("/confirm-reset-password");

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      if (token) {
        challenge.current?.reset();
      }

      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Welcome back. Log in to see who offers help with your courses and to manage your profile."
      aside={{
        heading: "Pick up where you left off.",
        text: "Courses, Help Offers and the students who can help, all in one place.",
        visual: (
          <div className="relative h-[300px]">
            <SampleCourseCard
              code="STA 2000"
              title="Business Statistics I"
              className="absolute top-0 left-[4%] -rotate-3"
            />
            <SampleCourseCard
              code="ACC 2101"
              title="Principles of Accounting"
              className="absolute top-[100px] left-[16%] rotate-2"
            />
            <SampleCourseCard
              code="CIS 3400"
              title="Database Management Systems"
              className="absolute top-[200px] left-[6%] -rotate-1"
            />
          </div>
        ),
      }}
    >
      <form
        onSubmit={(event) => {
          void handleResetPassword(event);
        }}
        className="flex flex-col gap-5"
        aria-describedby={error ? "reset-password-error" : undefined}
      >
        <Field label="Email" htmlFor="user-email">
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>

        {/* <Field label="Password" htmlFor="login-password">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            autoComplete="current-password"
            required
          />
        </Field> */}

        <TurnstileNote>
          <AuthChallenge ref={challenge} action="reset" />
        </TurnstileNote>

        {error && <FormAlert id="login-error">{error}</FormAlert>}

        <button
          type="submit"
          disabled={loading}
          className={buttonClass({ size: "lg", block: true })}
        >
          {loading && <Spinner />}
          {loading ? "Resetting password…" : "Reset Password"}
        </button>
      </form>

      <p className="mt-6 text-muted">
        New to FindMyStudents?{" "}
        <Link href="/signup" className={LINK_CLASS}>
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
