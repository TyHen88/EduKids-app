import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserProgress } from "@/db/queries";

import OnboardingForm from "./onboarding-form";

// Child accounts are created with this synthetic email domain (see
// actions/family.ts). They must never reach the role picker.
const KID_EMAIL_DOMAIN = "@dummy.edukids.com";

type OnboardingPageProps = {
  params: Promise<{ lang: string }>;
};

const OnboardingPage = async ({ params }: OnboardingPageProps) => {
  const { lang } = await params;
  const { userId } = await auth();

  // Not signed in → back to the landing page.
  if (!userId) redirect(`/${lang}`);

  // Onboarding is for first sign-up only. If a profile already exists, the
  // user has already chosen a role — send them to their home instead of
  // letting them re-onboard on every visit/login.
  const userProgress = await getUserProgress();
  if (userProgress) {
    redirect(`/${lang}/${userProgress.role === "parent" ? "family" : "learn"}`);
  }

  // Defense-in-depth: a child account (parent-created) has no profile in THIS
  // database only when the Clerk identity and the data live in different
  // environments. A kid must never be offered the role picker (they could pick
  // "parent" and self-escalate), so bounce them back to the kids login instead
  // of treating them as a brand-new signup.
  const user = await currentUser();
  const isKidAccount = user?.emailAddresses?.some((e) =>
    e.emailAddress.endsWith(KID_EMAIL_DOMAIN)
  );
  if (isKidAccount) redirect(`/${lang}/kids-login`);

  return <OnboardingForm />;
};

export default OnboardingPage;
