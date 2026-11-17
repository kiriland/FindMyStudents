"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

type Account = {
  userId: string;
  email: string | null;
};

type AuthState = {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
};

const initialAuth: AuthState = {
  account: null,
  isLoading: true,
  error: null,
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  const hydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!auth) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return hydrated ? auth : initialAuth;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(initialAuth);

  useEffect(() => {
    let requestId = 0;

    async function updateAccount() {
      const currentRequest = ++requestId;
      try {
        const session = await fetchAuthSession();
        if (currentRequest !== requestId) return;

        const claims = session.tokens?.idToken?.payload;
        setAuth({
          account: typeof claims?.sub === "string" ? {
            userId: claims.sub,
            email: typeof claims.email === "string" ? claims.email : null,
          } : null,
          isLoading: false,
          error: null,
        });
      } catch {
        if (currentRequest !== requestId) return;
        setAuth({ account: null, isLoading: false, error: "Unable to load your account." });
      }
    }

    const stopListening = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn" || payload.event === "tokenRefresh") {
        void updateAccount();
      } else if (payload.event === "signedOut" || payload.event === "tokenRefresh_failure") {
        // ignore session reads that started before logout
        requestId++;
        setAuth({
          account: null,
          isLoading: false,
          error: payload.event === "tokenRefresh_failure"
            ? "Your session could not be refreshed. Please log in again."
            : null,
        });
      }
    });

    void updateAccount();
    return () => {
      requestId++;
      stopListening();
    };
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
