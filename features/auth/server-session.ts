import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/lib/amplify-server";

export type SignedInStudent = {
  id: string;
  givenName: string;
  familyName: string;
  email: string;
};

/**
 * Reads the signed-in student from the session cookies. Returns null when
 * signed out. Tokens are verified against the user pool before use.
 */
export const getSignedInStudent = cache(async (): Promise<SignedInStudent | null> => {
  // Amplify checks token expiry with Date.now() before it reads the cookies.
  // Mark the read as request-time first, so prerendering stops here instead.
  await connection();
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
    email: typeof claims.email === "string" ? claims.email : "",
  };
});
