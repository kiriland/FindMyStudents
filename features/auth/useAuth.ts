"use client";

// Configures Amplify in the browser, before anything here signs in or reads the session.
import "@/lib/amplify";
import { fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useSyncExternalStore } from "react";

interface Account {
  userId: string;
  email: string | null;
}

interface AuthState {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
}

// The server never knows the session, so it renders this, and so does hydration.
const LOADING: AuthState = { account: null, isLoading: true, error: null };

let state = LOADING;
let listening = false;
// Bumped by every read and logout, so a slower, older read can't overwrite a newer state.
let requestId = 0;
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((listener) => {
    listener();
  });
}

async function readSession() {
  const request = ++requestId;
  try {
    const claims = (await fetchAuthSession()).tokens?.idToken?.payload;
    if (request !== requestId) {
      return;
    }
    setState({
      account:
        typeof claims?.sub === "string"
          ? {
              userId: claims.sub,
              email: typeof claims.email === "string" ? claims.email : null,
            }
          : null,
      isLoading: false,
      error: null,
    });
  } catch {
    if (request === requestId) {
      setState({
        account: null,
        isLoading: false,
        error: "Unable to load your account.",
      });
    }
  }
}

/** Starts following the session the first time anything reads it, then for the life of the page. */
function subscribe(listener: () => void) {
  if (!listening) {
    listening = true;
    Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn" || payload.event === "tokenRefresh") {
        void readSession();
      } else if (
        payload.event === "signedOut" ||
        payload.event === "tokenRefresh_failure"
      ) {
        requestId++;
        setState({
          account: null,
          isLoading: false,
          error:
            payload.event === "tokenRefresh_failure"
              ? "Your session could not be refreshed. Please log in again."
              : null,
        });
      }
    });
    void readSession();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The signed-in account in the browser. Hydration always renders the loading
 * state the server sent, even when the session was read first, and then updates.
 */
export function useAuth() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );
}
