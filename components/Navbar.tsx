"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import Link from "next/link";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>();

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
    <nav aria-label="Main navigation">
      <Link href="/">Home</Link>{" "}
      <Link href="/dashboard">Dashboard</Link>{" "}
      {email ? (
        <span>Welcome, {email} </span>
      ) : (
        <>
          <Link href="/login">Login</Link>{" "}
          <Link href="/signup">Sign Up</Link>{" "}
        </>
      )}
    </nav>
  );
}
