import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signUp,
} from "aws-amplify/auth";

async function verifyChallenge(token: string, action: "login" | "signup") {
  let response: Response;
  try {
    response = await fetch("/api/auth/turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error("Please try again.");
  }
  if (!response.ok) {
    throw new Error("Please try again.");
  }
}

export async function signInWithEmail(email: string, password: string, token: string) {
  await verifyChallenge(token, "login");
  return signIn({
    username: email,
    password,
  });
}

export type SignupDetails = {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
};

export async function signUpWithEmail({ email, password, givenName, familyName }: SignupDetails, token: string) {
  await verifyChallenge(token, "signup");
  return signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        given_name: givenName,
        family_name: familyName,
      },
    },
  });
}

export function confirmEmailSignup(email: string, confirmationCode: string) {
  return confirmSignUp({
    username: email,
    confirmationCode,
  });
}

export { getCurrentUser };
