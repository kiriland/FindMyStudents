"use client";

import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import Link from "next/link";
import { useAuth } from "@/features/auth/components/AuthProvider";
import styles from "./Navbar.module.css";

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
    <nav aria-label="Main navigation" className={styles.navbar}>
      <div className={styles.pages}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <div className={styles.account}>
        {isLoading ? (
          <span role="status" className={styles.welcome}>Loading account...</span>
        ) : account ? (
          <>
            <span className={styles.welcome} title={account.email ?? undefined}>
              {account.email ? `Welcome, ${account.email}` : "Signed in"}
            </span>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup" className={styles.signup}>Sign Up</Link>
          </>
        )}
        {(error || logoutError) && <p role="alert">{error || logoutError}</p>}
      </div>
    </nav>
  );
}
