import type { Metadata } from "next";
import SignUpForm from "@/features/auth/components/SignupForm";

export default function SignUpPage(){
  return (
    <SignUpForm />
  )
}

export const metadata: Metadata = { title: "Sign up" };
