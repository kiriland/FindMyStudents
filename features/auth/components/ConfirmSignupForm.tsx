"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmEmailSignup } from "@/features/auth/auth-client";

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
    <form onSubmit={handleConfirm}>
      <h1>Confirm Sign Up</h1>
      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      <label htmlFor="code">Verification Code</label>
      <input
        type="text"
        id="code"
        value={code}
        onChange={handleCodeChange}
        required
      />

      <button type="submit">Verify Email</button>
      {error && <p>{error}</p>}
    </form>
  );
}
