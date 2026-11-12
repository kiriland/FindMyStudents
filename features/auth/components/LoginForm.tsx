
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { signInWithEmail } from "@/features/auth/auth-client";
import AuthChallenge, {
  getChallengeToken,
  type TurnstileInstance,
} from "./AuthChallenge";

export default function LoginForm() {
  const challenge = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSignIn(
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

      const { isSignedIn, nextStep } = await signInWithEmail(
        email.trim(),
        password,
        token
      );

      if (isSignedIn && nextStep.signInStep === "DONE") {
        router.push("/");
        router.refresh();
      } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        router.push("/confirm-signup");
      } else {
        setError("Additional sign-in verification is required.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
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
      onSubmit={handleSignIn}
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
          Welcome Back
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Log in to connect with your Baruch College community.
        </p>
      </div>

      {/* LOGIN FIELDS */}
      <div className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Email Address
          </label>

          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-sm font-semibold text-zinc-800"
          >
            Password
          </label>

          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
          />
        </div>

        {/* SECURITY VERIFICATION */}
        <div className="min-w-0 overflow-hidden">
          <AuthChallenge
            ref={challenge}
            action="login"
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

        {/* LOGIN BUTTON */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Logging In..." : "Log In"}
        </Button>
      </div>

      {/* SIGNUP LINK */}
      <p className="mt-7 text-center text-sm text-zinc-600">
        New to FindMyStudents?{" "}
        <Link
          href="/signup"
          className="font-semibold text-blue-600 hover:underline"
        >
          Create an Account
        </Link>
      </p>

      {/* FOOTER */}
      <div className="mt-7 border-t border-zinc-100 pt-5 text-center">
        <p className="text-xs text-zinc-500">
          Built for the Baruch College community
        </p>
      </div>
    </form>
  );
}
