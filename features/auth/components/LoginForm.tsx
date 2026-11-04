"use client";

import { useState } from "react";
import { signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
  }

  async function handleSignIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password,
      });

      if (isSignedIn && nextStep.signInStep === "DONE") {
        router.push("/");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSignIn} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700">
      <h1 className="text-center text-3xl font-bold">Log In</h1>
      <label htmlFor="email" className="font-semibold">Email</label>
      <Input
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      <label htmlFor="password" className="font-semibold">Password</label>
      <Input
        type="password"
        id="password"
        value={password}
        onChange={handlePasswordChange}
        required
      />

      <Button type="submit">Log In</Button>
      {error && <p>{error}</p>}
    </form>
  )
}