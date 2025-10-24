'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser } from '@/lib/mock-data';
import Image from 'next/image';

export function Header() {
  const [user, setUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const [, setIsInMiniApp] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp();
        setIsInMiniApp(miniAppStatus);

        if (miniAppStatus) {
          const context = await sdk.context;
          console.log("Header context:", context);
          setUser(context.user);
        }
      } catch (error) {
        console.error("Error loading user data in header:", error);
      }
    };

    loadUserData();
  }, []);

  const displayName = user?.displayName || user?.username || mockUser.username;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Bluera Logo */}
        <div className="flex items-center space-x-3">
          <Image 
            src="/original.webp" 
            alt="Bluera Logo" 
            width={32} 
            height={32}
            className="rounded-lg"
            unoptimized
          />
          <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent hidden md:block">
            BLUERA
          </span>
        </div>
        
        {/* Right: User Avatar */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-2">
              {user?.fid && (
                <span className="text-xs font-medium hidden sm:block">FID #{user.fid}</span>
              )}
            </div>
            {user?.username && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                @{user.username}
              </span>
            )}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.pfpUrl || mockUser.avatar} 
              alt={displayName} 
            />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
