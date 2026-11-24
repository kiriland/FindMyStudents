"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import Input, { INPUT_CLASS } from "@/components/Input";
import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import Field, { FormAlert, Spinner } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";
import { handleConfirmResetPassword } from "@/features/auth/auth-client";
import { keepReturnTo } from "@/features/auth/return-to-browser";

import PasswordInput from "./PasswordInput";
import AuthShell from "./AuthShell";

const PASSWORD_RULES = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  { label: "A lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  {
    label: "An uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  { label: "A number", test: (value: string) => /\d/.test(value) },
  {
    label: "A symbol, like ! ? # or @",
    test: (value: string) => /[^A-Za-z0-9\s]/.test(value),
  },
];

const STEPS = [
  {
    title: "Request a reset code",
    text: "Send a code to your account email.",
    state: "done",
  },
  {
    title: "Set a new password",
    text: "Enter your reset code and choose a new password.",
    state: "current",
  },
  {
    title: "Log in",
    text: "Use your new password to access your account.",
    state: "next",
  },
] as const;
const STEP_MARKER: Record<(typeof STEPS)[number]["state"], string> = {
  done: "border-brand bg-brand text-white",
  current:
    "border-brand bg-surface text-brand-strong shadow-[0_0_0_6px_rgb(37_99_235/0.12)]",
  next: "border-line-strong bg-surface text-subtle",
};

export default function ConfirmResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value);
  }

  async function handleConfirmPassword(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    // One confirmation at a time; the button also shows it's working.
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    setError("");
    setLoading(true);

    try {
      await handleConfirmResetPassword({
        username: email, 
        confirmationCode: code, 
        newPassword: password
      });

      router.push("/login");
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
      title="Confirm your password"
      subtitle="Enter the email you signed up with and the 6-digit code we sent to it. It can take a minute to arrive."
      aside={{
        heading: "Almost there.",
        text: "Confirming your email makes sure the account is really yours.",
        visual: (
          <ol className="flex flex-col gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full border-2 font-display font-semibold ${STEP_MARKER[step.state]}`}
                >
                  {step.state === "done" ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="pt-1.5">
                  <strong
                    className={`block font-display font-semibold ${step.state === "next" ? "text-subtle" : "text-ink"}`}
                  >
                    {step.title}
                  </strong>
                  <small className="text-[15px] text-muted">{step.text}</small>
                </span>
              </li>
            ))}
          </ol>
        ),
      }}
    >
      <form
        onSubmit={(event) => {
          void handleConfirmPassword(event);
        }}
        className="flex flex-col gap-5"
      >
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

        <Field
          label="Verification code"
          htmlFor="code"
          hint="Check your spam folder if it hasn’t arrived."
          hintId="code-hint"
        >
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

         <Field label="Password" htmlFor="signup-password">
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            autoComplete="new-password"
            aria-describedby="signup-password-rules"
            required
          />
          <ul
            id="signup-password-rules"
            aria-label="Password requirements"
            className="mt-1 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2"
          >
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 transition-colors duration-200 ${met ? "text-success" : "text-subtle"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-[18px] shrink-0 place-items-center rounded-full border transition-[background-color,border-color] duration-200 ${
                      met
                        ? "border-success bg-success text-white"
                        : "border-line-strong"
                    }`}
                  >
                    {met && <CheckIcon className="size-3" />}
                  </span>
                  {rule.label}
                  {met && <span className="sr-only"> (done)</span>}
                </li>
              );
            })}
          </ul>
        </Field>


        {error && <FormAlert>{error}</FormAlert>}

        <button
          type="submit"
          disabled={loading}
          className={buttonClass({ size: "lg", block: true })}
        >
          {loading && <Spinner />}
          {loading ? "Confirming…" : "Confirm email"}
        </button>
      </form>

      <p className="mt-6 text-muted">
        Already confirmed?{" "}
        <button
          type="button"
          className={LINK_CLASS}
          onClick={() => {
            router.push(keepReturnTo("/login"));
          }}
        >
          Log in
        </button>
      </p>
    </AuthShell>
  );
}
