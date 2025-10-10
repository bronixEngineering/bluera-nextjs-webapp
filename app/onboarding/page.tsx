"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";
import { Onboarding } from "@/components/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if we're in a mini app
        const miniAppStatus = await sdk.isInMiniApp();
        
        if (miniAppStatus) {
          // Get user context
          const context = await sdk.context;
          const userFid = context.user.fid;
          
          // Check if user has completed onboarding
          const hasCompleted = localStorage.getItem(`onboarding_completed_v2_${userFid}`);
          
          if (hasCompleted) {
            // User already completed onboarding, redirect to app
            router.push("/app");
            return;
          }
        }
        
        // Show onboarding
        setShouldShowOnboarding(true);
        
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Show onboarding anyway
        setShouldShowOnboarding(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  const handleComplete = () => {
    // Redirect to app page after onboarding
    router.push("/app");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shouldShowOnboarding) {
    return null; // Will redirect to /app
  }

  return (
    <Onboarding 
      userFid={0} // Will be handled by the component
      onComplete={handleComplete} 
    />
  );
}

