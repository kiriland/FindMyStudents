import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signUp,
} from "aws-amplify/auth";

export function signInWithEmail(email: string, password: string) {
  return signIn({
    username: email,
    password,
  });
}

export function signUpWithEmail(email: string, password: string) {
  return signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
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
