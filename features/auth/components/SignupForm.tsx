"use client";

import { signUpWithEmail } from "@/features/auth/auth-client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthChallenge, { getChallengeToken, type TurnstileInstance } from "./AuthChallenge";

export default function SignupForm() {
  const challenge = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
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
    const names = { givenName: givenName.trim(), familyName: familyName.trim() };
    if (!names.givenName || !names.familyName) {
      setError(names.givenName ? "Enter your last name." : "Enter your first name.");
      return;
    }
    submitting.current = true;
    setError("");
    let token: string | undefined;
    try {
      token = getChallengeToken(challenge.current);
      const { nextStep } = await signUpWithEmail({ email, password, ...names }, token);
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
    <form onSubmit={handleSubmit}>
      <h1>Sign Up</h1>
      <label htmlFor="given-name">First name</label>
      <input
        id="given-name"
        type="text"
        autoComplete="given-name"
        maxLength={256}
        value={givenName}
        required
        onChange={(e) => setGivenName(e.target.value)}
      />
      <label htmlFor="family-name">Last name</label>
      <input
        id="family-name"
        type="text"
        autoComplete="family-name"
        maxLength={256}
        value={familyName}
        required
        onChange={(e) => setFamilyName(e.target.value)}
      />
      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        value={email}
        required
        onChange={handleEmailChange}
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        required
        onChange={handlePasswordChange}
      />
      <AuthChallenge ref={challenge} action="signup" />
      <button type="submit">Sign Up</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
