const PLACEHOLDER_ORIGIN = "https://return-to.invalid";

/** `path` with `returnTo` as its return path, if there is one. */
export function withReturnTo(path: string, returnTo: string | null) {
  return returnTo ? `${path}?${new URLSearchParams({ next: returnTo })}` : path;
}

/** The login page, returning to `path` after a successful login. */
export function loginHref(path: string) {
  return withReturnTo("/login", path);
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
