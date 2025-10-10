"use client";

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  // SDK ready() is now called in OnboardingGuard after routing decision
  return <>{children}</>;
}
