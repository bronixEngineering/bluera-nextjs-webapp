"use client";

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  // Ready() is now called in specific pages after checks
  return <>{children}</>;
}
