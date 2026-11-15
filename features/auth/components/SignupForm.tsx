"use client"

import {signUp} from "aws-amplify/auth"
import {useState} from "react"
import {useRouter} from "next/navigation"
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function SignupForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email.endsWith("@stu-mail.baruch.cuny.edu")) {
      setError("This must be a Baruch email that ends in @stu-mail.baruch.cuny.edu");
      return;
    }

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password: password,
      options: {
        userAttributes: {
          email: email,
          },
        }
      });
      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        router.push("/confirm-signup");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700">
      <h1 className="text-center text-3xl font-bold">Sign Up</h1>
      <label htmlFor="email" className="font-semibold">Email</label>
      <Input 
        type="text" 
        id="email" 
        onChange={handleEmailChange}
        required
      />
      <label htmlFor="password" className="font-semibold">Password</label>
      <Input 
        id="password" 
        type="password" 
        onChange={handlePasswordChange}
        required
      />
      <Button type="submit">Sign Up</Button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  )
}