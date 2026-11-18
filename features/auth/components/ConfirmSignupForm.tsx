"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Input, { INPUT_CLASS } from "@/components/Input";
import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import Field, { FormAlert, Spinner } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";
import { confirmEmailSignup } from "@/features/auth/auth-client";
import { keepReturnTo } from "@/features/auth/return-to-browser";
import AuthShell from "./AuthShell";

const STEPS = [
  { title: "Account created", text: "Your name and email are saved.", state: "done" },
  { title: "Confirm your email", text: "Enter the code from your inbox.", state: "current" },
  { title: "Log in", text: "Then set up your profile and Help Offers.", state: "next" },
] as const;

export default function ConfirmSignupForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value)
  }

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // One confirmation at a time; the button also shows it's working.
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    setLoading(true);

    try {
      const result = await confirmEmailSignup(email, code);

      if (result.isSignUpComplete) {
        router.push(keepReturnTo("/login"));
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell
      step={2}
      title="Confirm your email"
      subtitle="Enter the email you signed up with and the 6-digit code we sent to it. It can take a minute to arrive."
      aside={{
        heading: "Almost there.",
        text: "Confirming your email makes sure the account is really yours.",
        visual: (
          <ol className="flex flex-col gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full border-2 font-display font-semibold ${
                    step.state === "done"
                      ? "border-brand bg-brand text-white"
                      : step.state === "current"
                        ? "border-brand bg-surface text-brand-strong shadow-[0_0_0_6px_rgb(37_99_235/0.12)]"
                        : "border-line-strong bg-surface text-subtle"
                  }`}
                >
                  {step.state === "done" ? <CheckIcon className="size-4" /> : index + 1}
                </span>
                <span className="pt-1.5">
                  <strong className={`block font-display font-semibold ${step.state === "next" ? "text-subtle" : "text-ink"}`}>{step.title}</strong>
                  <small className="text-[15px] text-muted">{step.text}</small>
                </span>
              </li>
            ))}
          </ol>
        ),
      }}
    >
      <form onSubmit={handleConfirm} className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email">
          <Input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field label="Verification code" htmlFor="code" hint="Check your spam folder if it hasn’t arrived." hintId="code-hint">
          <input
            type="text"
            id="code"
            value={code}
            onChange={handleCodeChange}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            aria-describedby="code-hint"
            className={`${INPUT_CLASS.replace("text-base ", "")} font-display text-2xl tracking-[0.35em] tabular-nums`}
            required
          />
        </Field>

        {error && <FormAlert>{error}</FormAlert>}

        <button type="submit" disabled={loading} className={buttonClass({ size: "lg", block: true })}>
          {loading && <Spinner />}
          {loading ? "Confirming…" : "Confirm email"}
        </button>
      </form>

      <p className="mt-6 text-muted">
        Already confirmed?{" "}
        <button type="button" className={LINK_CLASS} onClick={() => router.push(keepReturnTo("/login"))}>Log in</button>
      </p>
    </AuthShell>
  );
}
