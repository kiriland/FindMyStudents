const PLACEHOLDER_ORIGIN = "https://return-to.invalid";

/** The login page, returning to `path` after a successful login. */
export function loginHref(path: string) {
  return `/login?${new URLSearchParams({ next: path })}`;
}

/** Accepts only same-site paths, so a login link can't send students elsewhere. */
export function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
