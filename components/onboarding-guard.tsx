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
        console.log("🔍 OnboardingGuard: Starting check, pathname:", pathname);
        
        // Skip onboarding check for onboarding page itself
        if (pathname === "/onboarding") {
          console.log("✅ OnboardingGuard: Already on onboarding page, hiding splash");
          setIsChecking(false);
          sdk.actions.ready();
          return;
        }

        console.log("🚀 OnboardingGuard: Redirecting to /onboarding");
        // Always redirect to onboarding first, let onboarding page handle the logic
        router.push("/onboarding");
        setShouldShowOnboarding(true);
        
        // Hide splash screen after redirect
        setTimeout(() => {
          sdk.actions.ready();
        }, 100);
        
      } catch (error) {
        console.error("❌ OnboardingGuard: Error:", error);
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
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">OnboardingGuard: Checking...</p>
          <p className="text-xs text-muted-foreground">Pathname: {pathname}</p>
        </div>
      </div>
    );
  }

  // Don't render children if redirecting to onboarding
  if (shouldShowOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">OnboardingGuard: Redirecting to onboarding...</p>
          <p className="text-xs text-muted-foreground">Pathname: {pathname}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

