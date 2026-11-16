"use client";

import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { profileHref } from "@/features/profiles/profile-href";
import AccountMenu from "./AccountMenu";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { account, isLoading, error } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const router = useRouter();

  async function handleLogout() {
    setLogoutError("");
    try {
      await signOut();
      // Re-render server pages so signed-in content leaves the screen.
      router.refresh();
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    }
  }

  return (
    <nav aria-label="Main navigation" className={styles.navbar}>
      <div className={styles.pages}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        {account && <Link href={profileHref(account.userId)}>Profile</Link>}
      </div>
      <div className={styles.account}>
        {isLoading ? (
          <span role="status" className={styles.welcome}>Loading account...</span>
        ) : account ? (
          <AccountMenu
            email={account.email}
            profileHref={profileHref(account.userId)}
            onLogout={handleLogout}
          />
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
