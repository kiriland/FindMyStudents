"use client";

import { signUpWithEmail } from "@/features/auth/auth-client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthChallenge, { getChallengeToken, type TurnstileInstance } from "./AuthChallenge";

export default function SignupForm() {
  const challenge = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    let token: string | undefined;
    try {
      token = getChallengeToken(challenge.current);
      const { nextStep } = await signUpWithEmail(email, password, token);
      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        router.push("/confirm-signup");
      } else {
        router.push("/login");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign-up failed. Please try again.");
    } finally {
      if (token) challenge.current?.reset();
      submitting.current = false;
    }
  }

  return (
    <form className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl bg-white p-7.5" onSubmit={handleSubmit}>
      <h1 className="text-center text-[30px] font-bold">Sign Up</h1>
      <label className="text-base font-semibold" htmlFor="email">Email</label>
      <input
        className="w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base"
        type="email"
        id="email"
        value={email}
        required
        onChange={handleEmailChange}
      />
      <label className="text-base font-semibold" htmlFor="password">Password</label>
      <input
        className="w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base"
        id="password"
        type="password"
        value={password}
        required
        onChange={handlePasswordChange}
      />
      <AuthChallenge ref={challenge} action="signup" />
      <button className="cursor-pointer rounded-lg bg-[#a9a9a9] px-4 py-3 font-semibold text-white hover:bg-[#808080]" type="submit">Sign Up</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
