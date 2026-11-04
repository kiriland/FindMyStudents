"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmEmailSignup } from "@/features/auth/auth-client";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function ConfirmSignupForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value)
  }

  async function handleConfirm(e: React.SubmitEvent<HTMLFormElement>) {
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
    <form onSubmit={handleConfirm} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700">
      <h1 className="text-center text-3xl font-bold">Confirm Sign Up</h1>
      <label htmlFor="email" className="font-semibold">Email</label>
      <Input
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      <label htmlFor="code" className="font-semibold">Verification Code</label>
      <Input
        type="text"
        id="code"
        value={code}
        onChange={handleCodeChange}
        required
      />

      <Button type="submit">Verify Email</Button>
      {error && <p>{error}</p>}
    </form>
  );
}
