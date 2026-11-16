import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/lib/amplify-server";

export type SignedInStudent = {
  id: string;
  givenName: string;
  familyName: string;
};

/**
 * Reads the signed-in student from the session cookies. Returns null when
 * signed out. Tokens are verified against the user pool before use.
 */
export const getSignedInStudent = cache(async (): Promise<SignedInStudent | null> => {
  const session = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: (contextSpec) => fetchAuthSession(contextSpec),
  });
  const claims = session.tokens?.idToken?.payload;
  if (typeof claims?.sub !== "string") return null;
  return {
    id: claims.sub,
    givenName: typeof claims.given_name === "string" ? claims.given_name.trim() : "",
    familyName: typeof claims.family_name === "string" ? claims.family_name.trim() : "",
  };
});
