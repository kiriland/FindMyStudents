"use client"

import {signUp} from "aws-amplify/auth"
import {useState} from "react"
import {useRouter} from "next/navigation"

export default function SignupForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
      console.error("Sign-up error:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign Up</h1>
      <label htmlFor="email">Email</label>
      <input 
        type="text" 
        id="email" 
        onChange={handleEmailChange}
      />
      <label htmlFor="password">Password</label>
      <input 
        id="password" 
        type="password" 
        onChange={handlePasswordChange}
      />
      <button type="submit">Sign Up</button>
    </form>
  )
}