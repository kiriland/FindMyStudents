"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { Ref } from "react";

export type { TurnstileInstance };

export function getChallengeToken(widget: TurnstileInstance | null): string {
  const token = widget?.getResponse();
  if (!token) throw new Error("Please complete verification and try again.");
  return token;
}

export default function AuthChallenge({
  action,
  ref,
}: {
  action: "login" | "signup";
  ref: Ref<TurnstileInstance>;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  // The wrapper removes the widget on unmount, including cached route transitions.
  return (
    <Turnstile
      ref={ref}
      siteKey={siteKey}
      options={{ action, appearance: "interaction-only", responseField: false }}
    />
  );
}
