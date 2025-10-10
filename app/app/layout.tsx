"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "@/components/header";
import { TabNavigation } from "@/components/tab-navigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Hide splash screen when app pages load
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 lg:pb-6 lg:ml-64">
        <div className="max-w-none mx-auto px-6 lg:px-8 xl:px-12">
          {children}
        </div>
      </main>
      <TabNavigation />
    </div>
  );
}
