
"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/Button";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    async function updateUser() {
      try {
        const session = await fetchAuthSession();
        const userEmail = session.tokens?.idToken?.payload.email;

        setEmail(
          typeof userEmail === "string" ? userEmail : null
        );
      } catch {
        setEmail(null);
      }
    }

    void updateUser();
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await signOut();
      setEmail(null);
      closeMenu();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  const navigationLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
  ];

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
          {email ? (
            <>
              <span
                className="max-w-40 truncate text-xs text-zinc-600"
                title={email}
              >
                {email}
              </span>

              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-zinc-700"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
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
          className="relative z-50 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:bg-zinc-100 active:bg-blue-50 md:hidden"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
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

            {email ? (
              <>
                <p className="break-all px-4 py-2 text-sm text-zinc-600">
                  Signed in as: {email}
                </p>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full justify-start text-zinc-700"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </Button>
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
    </nav>
  );
}
