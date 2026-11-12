
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { signUpWithEmail } from "@/features/auth/auth-client";
import AuthChallenge, {
  getChallengeToken,
  type TurnstileInstance,
} from "./AuthChallenge";

export default function SignupForm() {
  const challenge = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(
    e: React.SubmitEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (submitting.current) return;

    submitting.current = true;
    setError("");
    setLoading(true);

    let token: string | undefined;

    try {
      token = getChallengeToken(challenge.current);

      const { nextStep } = await signUpWithEmail(
        email.trim(),
        password,
        token
      );

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        router.push("/confirm-signup");
      } else if (nextStep.signUpStep === "DONE") {
        router.push("/login");
      } else {
        setError(
          "Additional steps are required to complete registration."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-up failed. Please try again."
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
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10"
    >
      {/* LOGO AND WELCOME */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex justify-center">
          <Image
            src="/favicon.ico"
            alt="FindMyStudents Logo"
            width={90}
            height={90}
            unoptimized
            priority
            className="h-[90px] w-[90px] object-contain"
          />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
          FindMyStudents
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Join the Community
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Create your account and start connecting with fellow
          Baruch College students.
        </p>
      </div>

      {/* REGISTRATION FIELDS */}
      <div className="space-y-5">
        <div>
          <label
            htmlFor="signup-email"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Email Address
          </label>

          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Use your Baruch College student email.
          </p>
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Create Password
          </label>

          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            autoComplete="new-password"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Choose a strong password to protect your account.
          </p>
        </div>

        {/* SECURITY VERIFICATION */}
        <div className="min-w-0 overflow-hidden">
          <AuthChallenge
            ref={challenge}
            action="signup"
          />
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* SIGNUP BUTTON */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </div>

      {/* LOGIN LINK */}
      <p className="mt-7 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Log In
        </Link>
      </p>

      {/* FOOTER */}
      <div className="mt-7 border-t border-zinc-100 pt-5 text-center">
        <p className="text-xs text-zinc-500">
          Connect. Collaborate. Succeed.
        </p>
      </div>
    </form>
  );
}
