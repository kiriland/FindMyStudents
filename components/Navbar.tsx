"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import Link from "next/link";
import Button, { buttonClass } from "@/components/Button";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    await signOut();
    setEmail(null);
    closeMenu();
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
      <Button
        variant="ghost"
        className="justify-self-end sm:hidden"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-6">
          <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </Button>
      <div id="main-menu" className={`${menuOpen ? "flex" : "hidden"} flex-col gap-3 sm:contents`}>
        <div className="flex flex-col items-start gap-1 sm:col-start-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <Link href="/" className={buttonClass("ghost")} onClick={closeMenu}>Home</Link>
          <Link href="/dashboard" className={buttonClass("ghost")} onClick={closeMenu}>Dashboard</Link>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1 border-t border-zinc-200 pt-3 sm:col-start-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:border-0 sm:pt-0 dark:border-zinc-800">
          {email ? (
            <>
              <span className="max-w-full truncate px-3 text-xs sm:px-0" title={email}>Welcome, {email}</span>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost")} onClick={closeMenu}>Login</Link>
              <Link href="/signup" className={buttonClass("outline")} onClick={closeMenu}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}