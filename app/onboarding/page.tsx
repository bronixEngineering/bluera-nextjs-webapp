"use client";

import { Onboarding } from "@/components/onboarding";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to home page after onboarding
    router.push("/");
  };

  return (
    <Onboarding 
      userFid={0} // Will be handled by the component
      onComplete={handleComplete} 
    />
  );
}

