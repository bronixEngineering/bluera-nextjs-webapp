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
          const hasCompleted = localStorage.getItem(`onboarding_completed_v3_${userFid}`);
          
          if (hasCompleted) {
            // User already completed onboarding, redirect to profile by default
            router.push("/app/profile");
            return;
          }
        }
        
        // Show onboarding
        setShouldShowOnboarding(true);
        
        // Hide splash screen now that we're showing onboarding
        sdk.actions.ready();
        
      } catch (error) {
        console.error("❌ OnboardingPage: Error:", error);
        // Show onboarding anyway
        setShouldShowOnboarding(true);
        sdk.actions.ready();
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [router]);

  const handleComplete = () => {
    // Redirect to profile page after onboarding
    router.push("/app/profile");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">OnboardingPage: Checking status...</p>
          <p className="text-xs text-muted-foreground">Loading user data and localStorage...</p>
        </div>
      </div>
    );
  }

  if (!shouldShowOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">OnboardingPage: Redirecting to app...</p>
          <p className="text-xs text-muted-foreground">User already completed onboarding</p>
        </div>
      </div>
    );
  }

  return (
    <Onboarding 
      userFid={0} // Will be handled by the component
      onComplete={handleComplete} 
    />
  );
}

