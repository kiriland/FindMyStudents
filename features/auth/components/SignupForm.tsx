"use client";

// Configures Amplify before this form signs up.
import "@/lib/amplify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import Input from "@/components/Input";
import { buttonClass, LINK_CLASS } from "@/components/ui/button";
import Field, { FormAlert, Spinner } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";
import { signUpWithEmail } from "@/features/auth/auth-client";
import { keepReturnTo } from "@/features/auth/return-to-browser";
import { MAX_HELP_OFFERS } from "@/features/profiles/profile-model";

import type { TurnstileInstance } from "./AuthChallenge";

import AuthChallenge, { getChallengeToken } from "./AuthChallenge";
import AuthShell from "./AuthShell";
import PasswordInput from "./PasswordInput";
import TurnstileNote from "./TurnstileNote";

// The account password policy (infrastructure/profiles/main.tf), shown as the
// student types. Cognito still enforces it.
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

export default function SignupForm() {
  const challenge = useRef<TurnstileInstance>(null);
  const submitting = useRef(false);
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const passwordReady = PASSWORD_RULES.every((rule) => rule.test(password));

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting.current) {
      return;
    }

    const names = {
      givenName: givenName.trim(),
      familyName: familyName.trim(),
    };
    if (!names.givenName || !names.familyName) {
      setError(
        names.givenName ? "Enter your last name." : "Enter your first name.",
      );
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@stu-mail.baruch.cuny.edu")) {
      setError("Please use your Baruch student email.");
      return;
    }

    if (!passwordReady) {
      setError(
        "Choose a password that meets every requirement below the password field.",
      );
      return;
    }

    submitting.current = true;
    setError("");
    setLoading(true);

    let token: string | undefined;

    try {
      token = getChallengeToken(challenge.current);

      const { nextStep } = await signUpWithEmail(
        { email: email.trim(), password, ...names },
        token,
      );

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        router.push(keepReturnTo("/confirm-signup"));
      } else if (nextStep.signUpStep === "DONE") {
        router.push(keepReturnTo("/login"));
      } else {
        setError("Additional steps are required to complete registration.");
      }
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "Sign-up failed. Please try again.",
      );
    } finally {
      if (token) {
        challenge.current?.reset();
      }

      submitting.current = false;
      setLoading(false);
    }
  }

  // Profiles show a first name and last initial; the preview does the same.
  const first = givenName.trim();
  const last = familyName.trim();
  const previewName = first
    ? `${first}${last ? ` ${last.charAt(0).toUpperCase()}.` : ""}`
    : "";
  const initials = `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

  return (
    <AuthShell
      step={1}
      title="Create your account"
      subtitle="It takes about a minute. Next, you’ll confirm your email with a code."
      aside={{
        heading: "Your profile, taking shape.",
        text: "This is how other logged-in students will see you. Add a bio, a picture and your Help Offers once you’re in.",
        visual: (
          <div className="flex flex-col gap-6">
            <div className="max-w-[380px] rounded-[18px] border border-line bg-surface p-5 shadow-float">
              <div className="flex items-center gap-3.5">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-100 font-display text-xl font-semibold text-brand-strong">
                  {initials || "?"}
                </span>
                <span className="min-w-0">
                  <strong
                    className={`block truncate font-display text-lg font-semibold ${previewName ? "text-ink" : "text-faint"}`}
                  >
                    {previewName || "Your name"}
                  </strong>
                  <small className="text-sm text-subtle">
                    Offers help with 0 courses
                  </small>
                </span>
              </div>
              <div className="mt-4 rounded-ctl border border-dashed border-brand-200 px-3.5 py-3 font-display text-sm font-medium text-brand-strong">
                + Add the courses you can help with
              </div>
            </div>
            <ul className="flex flex-col gap-2.5 text-ink-2">
              {[
                "See who offers help with each course",
                "Create a profile with a bio and picture",
                `Offer help with up to ${String(MAX_HELP_OFFERS)} courses`,
              ].map((perk) => (
                <li key={perk} className="flex items-center gap-2.5">
                  <span className="grid size-6 place-items-center rounded-full bg-brand text-white">
                    <CheckIcon className="size-3.5" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        ),
      }}
    >
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="signup-given-name">
            <Input
              id="signup-given-name"
              type="text"
              value={givenName}
              onChange={(e) => {
                setGivenName(e.target.value);
              }}
              autoComplete="given-name"
              maxLength={256}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="signup-family-name">
            <Input
              id="signup-family-name"
              type="text"
              value={familyName}
              onChange={(e) => {
                setFamilyName(e.target.value);
              }}
              autoComplete="family-name"
              maxLength={256}
              required
            />
          </Field>
        </div>

        <Field
          label="Email"
          htmlFor="signup-email"
          hint="Use your Baruch College student email. We’ll send a code there to confirm it’s yours."
          hintId="signup-email-hint"
        >
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            aria-describedby="signup-email-hint"
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

        <TurnstileNote>
          <AuthChallenge ref={challenge} action="signup" />
        </TurnstileNote>

        {error && <FormAlert>{error}</FormAlert>}

        <button
          type="submit"
          disabled={loading}
          className={buttonClass({ size: "lg", block: true })}
        >
          {loading && <Spinner />}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-muted">
        Already have an account?{" "}
        <Link href="/login" className={LINK_CLASS}>
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
