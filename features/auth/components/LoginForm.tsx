
"use client";

import { useState } from "react";
import { signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSignIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email.trim(),
        password,
      });

      if (isSignedIn && nextStep.signInStep === "DONE") {
        router.push("/");
        router.refresh();
      } else {
        setError("Additional verification is required to sign in.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSignIn}
      className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10"
    >
      {/* Logo and Welcome Section */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex justify-center">
          <Image
            src="/favicon.ico"
            alt="FindMyStudents Logo"
            width={90}
            height={90}
            className="h-[90px] w-[90px] object-contain"
            unoptimized
            priority
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

      {/* Login Fields */}
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

        {/* Error Message */}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* Login Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full justify-center rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Logging In..." : "Log In"}
        </Button>
      </div>

      {/* Sign Up Link */}
      <p className="mt-7 text-center text-sm text-zinc-600">
        New to FindMyStudents?{" "}
        <Link
          href="/signup"
          className="font-semibold text-blue-600 hover:underline"
        >
          Create an Account
        </Link>
      </p>

      {/* Footer */}
      <div className="mt-7 border-t border-zinc-100 pt-5 text-center">
        <p className="text-xs text-zinc-500">
          Built for the Baruch College community
        </p>
      </div>
    </form>
  );
}
