"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Plus,
  ChevronRight 
} from "lucide-react";

interface OnboardingProps {
  userFid: number;
  onComplete: () => void;
}

const onboardingSteps = [
  {
    icon: TrendingUp,
    title: "Track Your Trading Performance",
    description: "Monitor your crypto trades, analyze P&L, and track your portfolio performance in real-time.",
    color: "text-blue-500"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics & Insights",
    description: "Get detailed trading analytics, market trends, and personalized insights to improve your strategy.",
    color: "text-green-500"
  },
  {
    icon: Users,
    title: "Compete with Other Traders",
    description: "Join leaderboards, compare your performance with other traders, and climb the rankings.",
    color: "text-purple-500"
  }
];

export function Onboarding({ userFid, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [user, setUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);

  // Get user data if not provided
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp();
        if (miniAppStatus) {
          const context = await sdk.context;
          setUser(context.user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    if (userFid === 0) {
      loadUserData();
    } else {
      setUser({ fid: userFid });
    }
  }, [userFid]);

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - add mini app
      await handleAddMiniApp();
    }
  };

  const handleAddMiniApp = async () => {
    try {
      setIsAdding(true);
      await sdk.actions.addMiniApp();
      
      // Mark onboarding as completed
      const fid = user?.fid || userFid;
      localStorage.setItem(`onboarding_completed_v2_${fid}`, "true");
      onComplete();
    } catch (error) {
      console.error("Failed to add mini app:", error);
      // Still mark as completed even if add fails
      const fid = user?.fid || userFid;
      localStorage.setItem(`onboarding_completed_v2_${fid}`, "true");
      onComplete();
    } finally {
      setIsAdding(false);
    }
  };

  const currentStepData = onboardingSteps[currentStep];
  const IconComponent = currentStepData.icon;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center p-6">
      {/* Logo/Icon */}
      <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mb-12 self-start">
        <IconComponent className="w-8 h-8 text-foreground" />
      </div>

      {/* Step Content - Left Aligned */}
      <div className="space-y-8 mb-16 w-full max-w-sm">
        {/* Progress Indicators - iOS Style */}
        <div className="flex space-x-2">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? "bg-primary w-8" 
                  : index < currentStep 
                    ? "bg-primary/60 w-6" 
                    : "bg-muted w-2"
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground">
          {currentStepData.title}
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          {currentStepData.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="w-full space-y-4">
        <Button 
          onClick={handleNext}
          disabled={isAdding}
          className="w-full flex items-center justify-center gap-2"
          size="lg"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Adding to Apps...
            </>
          ) : isLastStep ? (
            <>
              <Plus className="h-4 w-4" />
              Add Bluera to your Apps
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Skip Option (not on last step) */}
        {!isLastStep && (
          <button
            onClick={() => {
              const fid = user?.fid || userFid;
              localStorage.setItem(`onboarding_completed_v2_${fid}`, "true");
              onComplete();
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

// Hook to check if user has completed onboarding
export function useOnboardingStatus(userFid: number | null) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (userFid) {
      const completed = localStorage.getItem(`onboarding_completed_${userFid}`);
      setHasCompletedOnboarding(completed === "true");
    } else {
      setHasCompletedOnboarding(null);
    }
  }, [userFid]);

  return hasCompletedOnboarding;
}
