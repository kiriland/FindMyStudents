"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import Link from "next/link";
import Button, { buttonClass } from "@/components/Button";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>();

  async function handleLogout() {
    await signOut();
    setEmail(null);
  }

  useEffect(() => {
    async function updateUser() {
      try {
        const session = await fetchAuthSession();
        const email = session.tokens?.idToken?.payload.email;
        setEmail(typeof email === "string" ? email : null);
      } catch {
        setEmail(null);
      }
    }

    void updateUser();
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className="grid grid-cols-1 items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 p-4 text-sm leading-normal font-medium sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-6 sm:px-6 sm:py-5 lg:px-12"
    >
      <div className="flex items-center justify-center gap-4 sm:col-start-2">
        <Link href="/" className={buttonClass("ghost")}>Home</Link>
        <Link href="/dashboard" className={buttonClass("ghost")}>Dashboard</Link>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-3 sm:col-start-3">
        {email ? (
          <>
            <span className="truncate text-xs" title={email}>Welcome, {email}</span>
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Link href="/login" className={buttonClass("ghost")}>Login</Link>
            <Link href="/signup" className={buttonClass("outline")}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
