
"use client";

import { useState } from "react";
import { signOut } from "aws-amplify/auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function Navbar() {
  const { account, isLoading, error } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLogoutError("");
    setLoggingOut(true);

    try {
      await signOut();
      closeMenu();
      router.push("/");
      router.refresh();
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const accountEmail = account?.email;

  return (
    <nav
      aria-label="Main navigation"
      className="relative z-50 w-full border-b border-zinc-200 bg-white text-zinc-900"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">

        {/* BRANDING */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <Image
            src="/favicon.ico"
            alt="FindMyStudents logo"
            width={44}
            height={44}
            unoptimized
            priority
            className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
          />

          <div className="flex min-w-0 flex-col">
            <span className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg">
              FindMyStudents
            </span>

            <span className="text-[10px] font-medium text-zinc-500 sm:text-xs">
              Baruch College Community
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-2 md:flex">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-blue-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* DESKTOP AUTHENTICATION */}
        <div className="hidden min-w-0 items-center gap-3 md:flex">
          {isLoading ? (
            <span role="status" className="text-sm text-zinc-500">
              Loading account...
            </span>
          ) : account ? (
            <>
              <span
                className="max-w-40 truncate text-xs text-zinc-600"
                title={accountEmail ?? undefined}
              >
                {accountEmail
                  ? `Welcome, ${accountEmail}`
                  : "Signed in"}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Log In
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="relative z-50 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:bg-zinc-100 md:hidden"
        >
          {menuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE DROPDOWN */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-80px)] overflow-y-auto border-b border-zinc-200 bg-white px-4 py-5 shadow-xl md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-blue-600">
              Navigation
            </p>

            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`block rounded-xl px-4 py-3 text-base font-semibold transition ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-3 border-t border-zinc-200" />

            {isLoading ? (
              <p role="status" className="px-4 py-3 text-sm text-zinc-500">
                Loading account...
              </p>
            ) : account ? (
              <>
                <p className="break-all px-4 py-2 text-sm text-zinc-600">
                  {accountEmail
                    ? `Signed in as: ${accountEmail}`
                    : "Signed in"}
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  Create an Account
                </Link>
              </>
            )}

            <p className="mt-4 text-center text-xs text-zinc-500">
              Connect. Study. Collaborate.
            </p>
          </div>
        </div>
      )}

      {/* AUTHENTICATION ERRORS */}
      {(error || logoutError) && (
        <div
          role="alert"
          className="border-t border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
        >
          {error || logoutError}
        </div>
      )}
    </nav>
  );
}
