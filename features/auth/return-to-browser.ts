import { safeReturnTo, withReturnTo } from "./return-to";

// Browser only: these read the current page's URL.

/** The current page's return path, if it has a safe one. */
export function currentReturnTo() {
  return safeReturnTo(new URLSearchParams(window.location.search).get("next"));
}

/** `path`, carrying the current page's return path along. */
export function keepReturnTo(path: string) {
  return withReturnTo(path, currentReturnTo());
}
