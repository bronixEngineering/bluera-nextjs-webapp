"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { TabNavigation } from "@/components/tab-navigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Hide splash screen when app pages load
        sdk.actions.ready();
        
        // Check if we're in a Mini App and authenticate user
        const miniAppStatus = await sdk.isInMiniApp();
        if (miniAppStatus) {
          // Debug: Check what's available in SDK context
          const context = await sdk.context;
          
          // Authenticate with our backend and save FID to Supabase
          try {
            const response = await sdk.quickAuth.fetch('/api/auth');
            if (response.ok) {
              const authData = await response.json();
              setIsAuthenticated(true);
            }
          } catch (authError) {
            console.error("❌ App: Error authenticating user:", authError);
          }
        } else {
          setIsAuthenticated(true); // Allow app to work with mock data
        }
      } catch (error) {
        console.error("❌ App: Error initializing app:", error);
        setIsAuthenticated(true); // Allow app to work even if auth fails
      }
    };

    initializeApp();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 lg:pb-6 lg:ml-64">
        <div className="max-w-none mx-auto px-2 lg:px-8 xl:px-12">
          {children}
        </div>
      </main>
      <TabNavigation />
    </div>
  );
}
