"use client";

import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import Link from "next/link";
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
    <nav aria-label="Main navigation" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 border-b border-current/12 px-[clamp(1.25rem,4vw,4rem)] py-5 text-[15px] leading-normal font-medium [&_a]:inline-block [&_a]:shrink-0 [&_a]:px-3 [&_a]:py-2 [&_a]:text-inherit [&_a]:no-underline [&_a]:whitespace-nowrap [&_button]:inline-block [&_button]:shrink-0 [&_button]:cursor-pointer [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-2 [&_button]:text-inherit [&_button]:whitespace-nowrap [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-current [&_a:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-current [&_button:focus-visible]:outline-offset-3 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-3 max-[640px]:p-4 max-[640px]:text-sm">
      <div className="col-start-2 flex items-center gap-4 max-[640px]:col-start-1 max-[640px]:justify-center">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <div className="col-start-3 flex min-w-0 items-center justify-end gap-3 max-[640px]:col-start-1">
        {isLoading ? (
          <span role="status" className="truncate text-[13px]">Loading account...</span>
        ) : account ? (
          <>
            <span className="truncate text-[13px]" title={account.email ?? undefined}>
              {account.email ? `Welcome, ${account.email}` : "Signed in"}
            </span>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup" className="rounded-md border border-current/25 px-4!">Sign Up</Link>
          </>
        )}
        {(error || logoutError) && <p role="alert">{error || logoutError}</p>}
      </div>
    </nav>
  );
}
