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
    <form className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl bg-white p-7.5" onSubmit={handleConfirm}>
      <h1 className="text-center text-[30px] font-bold">Confirm Sign Up</h1>
      <label className="text-base font-semibold" htmlFor="email">Email</label>
      <input
        className="w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base"
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      <label className="text-base font-semibold" htmlFor="code">Verification Code</label>
      <input
        className="w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base"
        type="text"
        id="code"
        value={code}
        onChange={handleCodeChange}
        required
      />

      <button className="cursor-pointer rounded-lg bg-[#a9a9a9] px-4 py-3 font-semibold text-white hover:bg-[#808080]" type="submit">Verify Email</button>
      {error && <p>{error}</p>}
    </form>
  );
}
