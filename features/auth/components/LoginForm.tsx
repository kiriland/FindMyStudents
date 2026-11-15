"use client";

import { useRef, useState } from "react";
import { signInWithEmail } from "@/features/auth/auth-client";
import { useRouter } from "next/navigation";
import AuthChallenge, { getChallengeToken, type TurnstileInstance } from "./AuthChallenge";

export default function LoginForm() {
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

  async function handleSignIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting.current) return;
    submitting.current = true;
    setError("");
    let token: string | undefined;
    try {
      token = getChallengeToken(challenge.current);
      const { isSignedIn, nextStep } = await signInWithEmail(email, password, token);

      if (isSignedIn && nextStep.signInStep === "DONE") {
        router.push("/");
      } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
        router.push("/confirm-signup");
      } else {
        setError("Additional sign-in verification is required.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      if (token) challenge.current?.reset();
      submitting.current = false;
    }
  }

  return (
    <form className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl bg-white p-7.5" onSubmit={handleSignIn}>
      <h1 className="text-center text-[30px] font-bold">Log In</h1>
      <label className="text-base font-semibold" htmlFor="email">Email</label>
      <input
        className="w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base"
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        required
      />

      <label className="text-base font-semibold" htmlFor="password">Password</label>
      <input
        className="w-full rounded-lg border border-[#cbd3dd] bg-white px-3.5 py-3 text-base"
        type="password"
        id="password"
        value={password}
        onChange={handlePasswordChange}
        required
      />

      <AuthChallenge ref={challenge} action="login" />
      <button className="cursor-pointer rounded-lg bg-[#a9a9a9] px-4 py-3 font-semibold text-white hover:bg-[#808080]" type="submit">Log In</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
