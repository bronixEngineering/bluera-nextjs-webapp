"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Skip onboarding check for onboarding page itself
        if (pathname === "/onboarding") {
          setIsChecking(false);
          // Hide splash screen for onboarding page
          sdk.actions.ready();
          return;
        }

        // Check if we're in a mini app
        const miniAppStatus = await sdk.isInMiniApp();
        
        if (miniAppStatus) {
          // Get user context
          const context = await sdk.context;
          const userFid = context.user.fid;
          
          // Check if user has completed onboarding
          const hasCompleted = localStorage.getItem(`onboarding_completed_v2_${userFid}`);
          
          if (!hasCompleted) {
            // Redirect to onboarding
            await router.push("/onboarding");
            setShouldShowOnboarding(true);
          } else {
            // Redirect to app if onboarding completed
            if (pathname === "/") {
              await router.push("/app");
            }
          }
        }
        
        // Hide splash screen after all routing decisions
        setTimeout(() => {
          sdk.actions.ready();
        }, 100);
        
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Hide splash screen even on error
        sdk.actions.ready();
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [router, pathname]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if redirecting to onboarding
  if (shouldShowOnboarding) {
    return null;
  }

  return <>{children}</>;
}

