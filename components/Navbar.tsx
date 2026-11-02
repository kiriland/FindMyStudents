"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import Link from "next/link";
import styles from "./Navbar.module.css";

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
    <nav aria-label="Main navigation" className={styles.navbar}>
      <div className={styles.pages}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
      </div>
      <div className={styles.account}>
        {email ? (
          <>
            <span className={styles.welcome} title={email}>Welcome, {email}</span>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup" className={styles.signup}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
