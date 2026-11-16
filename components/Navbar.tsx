"use client";

import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import Button, { ButtonLink } from "./Button";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function Navbar() {
  const { account, isLoading, error } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    try {
      await signOut();
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    }
  }

  return (
    <nav
      aria-label="Main navigation"
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 border-b border-current/12 px-[clamp(1.25rem,4vw,4rem)] py-5 text-[15px] leading-normal font-medium max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-3 max-[640px]:p-4 max-[640px]:text-sm"
    >
      <div className="col-start-2 flex items-center gap-4 max-[640px]:col-start-1 max-[640px]:justify-center">
        <ButtonLink variant="navigation" href="/">
          Home
        </ButtonLink>
        <ButtonLink variant="navigation" href="/dashboard">
          Dashboard
        </ButtonLink>
      </div>
      <div className="col-start-3 flex min-w-0 items-center justify-end gap-3 max-[640px]:col-start-1">
        {isLoading ? (
          <span role="status" className="truncate text-[13px]">
            Loading account...
          </span>
        ) : account ? (
          <>
            <span
              className="truncate text-[13px]"
              title={account.email ?? undefined}
            >
              {account.email ? `Welcome, ${account.email}` : "Signed in"}
            </span>
            <Button variant="navigation" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <ButtonLink variant="navigation" href="/login">
              Login
            </ButtonLink>
            <ButtonLink variant="signup" href="/signup">
              Sign Up
            </ButtonLink>
          </>
        )}
        {(error || logoutError) && <p role="alert">{error || logoutError}</p>}
      </div>
    </nav>
  );
}
