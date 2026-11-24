import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signUp,
  resetPassword,
  ResetPasswordOutput,
  confirmResetPassword,
  ConfirmResetPasswordInput,
  updatePassword,
  UpdatePasswordInput,
} from "aws-amplify/auth";

async function verifyChallenge(token: string, action: "login" | "signup") {
  let response: Response;
  try {
    response = await fetch("/api/auth/turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Please try again.");
  }
  if (!response.ok) {
    throw new Error("Please try again.");
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
  token: string,
) {
  await verifyChallenge(token, "login");
  return signIn({
    username: email,
    password,
  });
}

export interface SignupDetails {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}

export async function signUpWithEmail(
  { email, password, givenName, familyName }: SignupDetails,
  token: string,
) {
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

export async function confirmEmailSignup(
  email: string,
  confirmationCode: string,
) {
  return confirmSignUp({
    username: email,
    confirmationCode,
  });
}

export async function handleResetPassword_Amplify(username: string) {
  try {
    const output = await resetPassword({ username });
    handleResetPasswordNextSteps(output);
  } catch (error) {
    console.log(error);
  }
}

export function handleResetPasswordNextSteps(output: ResetPasswordOutput) {
  const { nextStep } = output;
  if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
    const codeDeliveryDetails = nextStep.codeDeliveryDetails;
    console.log(`Confirmation code was sent to ${codeDeliveryDetails.deliveryMedium}`);
  }
  else if (nextStep.resetPasswordStep === 'DONE') {
    console.log('Successfully reset password.');
  }
  else {
    console.log('Error: Please try again.');
  }
}

export async function handleConfirmResetPassword({
  username,
  confirmationCode,
  newPassword
}: ConfirmResetPasswordInput) {
  try {
    await confirmResetPassword({ username, confirmationCode, newPassword });
  } catch (error) {
    console.log(error);
  }
}

export { getCurrentUser };
