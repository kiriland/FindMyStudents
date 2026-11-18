import { Suspense } from "react";
import ProfileContent, { type ProfileParams } from "@/features/profiles/components/ProfileContent";
import { ProfileLoading } from "@/features/profiles/components/ProfileFeedback";

export default function StudentProfilePage({ params }: { params: ProfileParams }) {
  return <main id="main" className="wrap w-full flex-1 pt-[clamp(28px,4vw,48px)] pb-24"><Suspense fallback={<ProfileLoading />}><ProfileContent params={params} /></Suspense></main>;
}
