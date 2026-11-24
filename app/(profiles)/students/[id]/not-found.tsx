import { ProfileNotFound } from "@/features/profiles/components/ProfileFeedback";

export default function NotFound() {
  return (
    <main
      id="main"
      className="wrap w-full flex-1 pt-[clamp(28px,4vw,48px)] pb-24"
    >
      <ProfileNotFound />
    </main>
  );
}
