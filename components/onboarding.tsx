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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Progress Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className={`p-4 rounded-full bg-muted/20 ${currentStepData.color}`}>
                <IconComponent className="h-12 w-12" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold tracking-tight">
              {currentStepData.title}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Action Button */}
            <div className="pt-4">
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
            </div>

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
        </CardContent>
      </Card>
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
