import Link from "next/link";

export default function Navbar() {
  return (
    <nav aria-label="Main navigation">
      <Link href="/">Dashboard</Link>{" "}
      <Link href="/login">Login</Link>{" "}
      <Link href="/signup">Sign Up</Link>{" "}
    </nav>
  );
}
