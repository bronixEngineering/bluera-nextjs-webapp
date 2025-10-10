"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Hide splash screen immediately
    sdk.actions.ready();
  }, []);

  return <>{children}</>;
}
