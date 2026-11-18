"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/useAuth";
import { profileHref } from "@/features/profiles/profile-model";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type AccountCtaProps = {
  /** What a signed-in student is invited to do on their Profile. */
  signedInLabel: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * "Create an account" for visitors; a link to their own Profile once signed in.
 * Visitors see the sign-up link while the session loads, as most are signed out.
 */
export default function AccountCta({ signedInLabel, variant = "primary", size = "md", className = "" }: AccountCtaProps) {
  const { account } = useAuth();
  const classes = buttonClass({ variant, size, className });
  return account ? (
    <Link href={profileHref(account.userId)} className={classes}>{signedInLabel}</Link>
  ) : (
    <Link href="/signup" className={classes}>Create an account</Link>
  );
}
