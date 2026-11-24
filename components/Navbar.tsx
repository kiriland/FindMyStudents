"use client";

import { signOut } from "aws-amplify/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui/button";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/features/auth/useAuth";
import { DISCOVERY_PATH } from "@/features/courses/course-model";
import { profileHref } from "@/features/profiles/profile-model";

import AccountMenu from "./AccountMenu";

// The bar turns solid once the page scrolls under it. The server and hydration
// render it at the top of the page.
function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => {
    window.removeEventListener("scroll", onChange);
  };
}
const isScrolled = () => window.scrollY > 8;
const atTop = () => false;
const LINK =
  "rounded-lg px-3 py-[9px] font-display text-[15px] leading-none font-medium transition-colors duration-150";

interface NavbarProps {
  /** Shown next to the Profile links, such as a count of pending requests. */
  profileBadge?: React.ReactNode;
}

export default function Navbar({ profileBadge }: NavbarProps) {
  const { account, isLoading, error } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled, atTop);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
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

  // Esc closes the mobile menu and returns focus to its button; so does a tap outside it.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      setMenuOpen(false);
      menuButton.current?.focus();
    }
    function handlePointerDown(event: PointerEvent) {
      if (
        !(event.target instanceof Node) ||
        !header.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  const alertMessage = error ?? logoutError;

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLogoutError("");
    setLoggingOut(true);

    try {
      await signOut();
      closeMenu();
      router.push("/");
      // Re-render server pages so signed-in content leaves the screen.
      router.refresh();
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const coursesActive =
    pathname === DISCOVERY_PATH || pathname.startsWith("/courses/");
  const navigationLinks = [
    { href: DISCOVERY_PATH, label: "Courses", current: coursesActive },
    { href: "/#how", label: "How it works", current: false },
    { href: "/#faq", label: "Questions", current: false },
  ];
  const ownProfile = account ? profileHref(account.userId) : null;
  const solid = scrolled || menuOpen;

  return (
    <header
      ref={header}
      className={`sticky top-0 z-40 w-full transition-[background-color,box-shadow] duration-250 ${
        solid
          ? "bg-surface/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur-[14px] backdrop-saturate-[1.4]"
          : "bg-canvas"
      }`}
    >
      <nav aria-label="Main" className="wrap flex h-[68px] items-center gap-3">
        <Logo onClick={closeMenu} />

        <ul className="ml-7 hidden items-center gap-0.5 md:flex">
          {navigationLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                className={`${LINK} ${item.current ? "bg-brand-50 text-brand-strong" : "text-muted hover:bg-well hover:text-ink"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden min-w-0 items-center gap-1.5 md:flex">
          {isLoading && (
            <span
              role="status"
              className="h-10 w-40 animate-pulse rounded-full bg-well"
            >
              <span className="sr-only">Loading account…</span>
            </span>
          )}
          {!isLoading && account && (
            <AccountMenu
              email={account.email}
              profileHref={profileHref(account.userId)}
              profileBadge={profileBadge}
              onLogout={() => {
                void handleLogout();
              }}
              loggingOut={loggingOut}
            />
          )}
          {!isLoading && !account && (
            <>
              <Link
                href="/login"
                aria-current={pathname === "/login" ? "page" : undefined}
                className={buttonClass({
                  variant: "ghost",
                  className: "aria-[current=page]:text-brand-strong",
                })}
              >
                Log in
              </Link>
              <Link href="/signup" className={buttonClass()}>
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          ref={menuButton}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => {
            setMenuOpen((previous) => !previous);
          }}
          className="ml-auto grid size-11 shrink-0 cursor-pointer place-items-center rounded-ctl text-ink transition-colors duration-150 hover:bg-well md:hidden"
        >
          {menuOpen ? (
            <CloseIcon className="size-[22px]" />
          ) : (
            <MenuIcon className="size-[22px]" />
          )}
        </button>
      </nav>

      {/* Mobile menu: stays in the page so it can animate; hidden from everyone while closed. */}
      <div
        id="mobile-navigation"
        className={`absolute inset-x-0 top-full max-h-[calc(100dvh-68px)] overflow-y-auto border-b border-line bg-surface py-3 pb-5 shadow-float transition-[opacity,translate,visibility] duration-250 ease-soft md:hidden ${
          menuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="wrap flex flex-col gap-1">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={item.current ? "page" : undefined}
              className={`${LINK} px-3 py-3.5 text-[17px] ${item.current ? "bg-brand-50 text-brand-strong" : "text-ink-2 hover:bg-well"}`}
            >
              {item.label}
            </Link>
          ))}

          <hr className="my-2 border-line" />

          {isLoading && (
            <p role="status" className="px-3 py-3 text-subtle">
              Loading account…
            </p>
          )}
          {!isLoading && account && (
            <>
              <p className="truncate px-3 pt-1 pb-2 text-sm text-subtle">
                {account.email ? (
                  <>
                    Logged in as{" "}
                    <span className="text-ink-2">{account.email}</span>
                  </>
                ) : (
                  "Logged in"
                )}
              </p>
              {ownProfile && (
                <Link
                  href={ownProfile}
                  onClick={closeMenu}
                  aria-current={pathname === ownProfile ? "page" : undefined}
                  className={`${LINK} px-3 py-3.5 text-[17px] text-ink-2 hover:bg-well aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-strong`}
                >
                  Your profile{profileBadge}
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={loggingOut}
                className={`${LINK} cursor-pointer px-3 py-3.5 text-left text-[17px] text-ink-2 hover:bg-well disabled:opacity-50`}
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </>
          )}
          {!isLoading && !account && (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/login"
                onClick={closeMenu}
                className={buttonClass({
                  variant: "secondary",
                  block: true,
                  size: "lg",
                })}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className={buttonClass({ block: true, size: "lg" })}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {alertMessage && (
        <div
          role="alert"
          className="border-t border-red-200 bg-danger-soft px-4 py-3 text-center text-sm text-danger"
        >
          {alertMessage}
        </div>
      )}
    </header>
  );
}
