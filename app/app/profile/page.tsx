"use client";

import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mockUser, mockUserStats, mockTokens } from "@/lib/mock-data";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Coins,
  DollarSign,
  Target,
  Activity,
  Award,
  LogIn,
} from "lucide-react";
import { ShareableAuraCard } from "@/components/shareable-aura-card";
import { useAccount } from "wagmi";


export default function ProfilePage() {
  const [user, setUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const favoriteToken = mockTokens.find(
    (token) => token.symbol === mockUserStats.favoriteCoin
  );

  const { address } = useAccount();
  const [holderTag, setHolderTag] = useState<string | null>(null);
  const [totalTrades, setTotalTrades] = useState<number | null>(null);

  useEffect(() => {
    const loadHolderTag = async () => {
      try {
        if (!address) return;
        const res = await fetch(`/api/aura-card-holder-tag?wallet=${encodeURIComponent(address)}&network=base`);
        if (!res.ok) return;
        const json = await res.json();
        setHolderTag((json.holder_tag ?? '') + " Holder");
      } catch (error) {
        console.error("Error loading holder tag:", error);
      }
    };
    loadHolderTag();
  }, [address]);

  // state'lerin yanına ekleyin
  const [allTimeVolumeReal, setAllTimeVolumeReal] = useState<number | null>(null);

  // effect içine ayrı bir fetch daha ekleyin (user FID geldikten sonra)
  useEffect(() => {
    const loadAllTimeVolume = async () => {
      try {
        const fid = user?.fid || null;
        if (!fid) return;
        const res = await fetch(`/api/wallet-status?fid=${encodeURIComponent(String(fid))}`);
        if (!res.ok) return;
        const json = await res.json();
        setAllTimeVolumeReal(Number(json.all_time_volume) || 0);
      } catch {}
    };
    loadAllTimeVolume();
  }, [user?.fid]);

  // imports altında uyguna ekleyin
  const fmtMoney = (v: number) => {
    const n = Math.abs(Number(v) || 0);
    if (n < 1000) return `$${n.toFixed(1)}`;
    if (n < 1_000_000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${(n / 1_000_000).toFixed(1)}M`;
  };

  useEffect(() => {
    const loadTotalTrades = async () => {
      try {
        if (!address) return;
        const res = await fetch(`/api/wallet-token-status?wallet=${encodeURIComponent(address)}`);
        if (!res.ok) return;
        const json = await res.json(); // expect { totalTrades: number }
        setTotalTrades(Number(json.totalTrades) || 0);
      } catch {}
    };
    loadTotalTrades();
  }, [address]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if we're in a Mini App
        const miniAppStatus = await sdk.isInMiniApp();
        setIsInMiniApp(miniAppStatus);
        console.log("🔍 Is in Mini App:", miniAppStatus);

        if (miniAppStatus) {
          // Get context and extract user info
          const context = await sdk.context;
          console.log("📱 Mini App Context:", context);
          setUser(context.user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);


  // Show message if not in Mini App
  if (!isInMiniApp && !isLoading) {
    return (
      <div className="py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Open in Base App
            </CardTitle>
            <CardDescription>
              Please open this app in Base or Farcaster client to see your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              This mini app needs to be opened from within Base or Farcaster to access your profile data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8">
      {/* Profile Header - Minimalist */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-purple-400/20">
            <AvatarImage 
              src={user?.pfpUrl || mockUser.avatar} 
              alt={user?.displayName || user?.username || mockUser.username} 
            />
            <AvatarFallback className="text-lg">
              {(user?.displayName || user?.username || mockUser.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">
              {user?.displayName || user?.username || mockUser.username}
            </h1>
            {user?.username && (
              <p className="text-sm text-muted-foreground">
                @{user.username}
              </p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          FID #{user?.fid || mockUser.fid}
        </Badge>
      </div>

      {/* Trading Aura Visualization - Shareable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Your Onchain Aura</CardTitle>
          <CardDescription className="text-center">
            Share your unique trading personality with the world
          </CardDescription>
        </CardHeader>
        <CardContent className="border-none bg-transparent">
          <ShareableAuraCard
            username={user?.username || mockUser.username}
            fid={user?.fid || mockUser.fid}
            pfpUrl={user?.pfpUrl || mockUser.avatar}
            holderTag={holderTag || ""}
            traderTag={allTimeVolumeReal != null && allTimeVolumeReal > 1000000 ? "Whale Trader" : ""}
            allTimeVolume={0}
            pnl={0}
            networth={0}
            weeklyVolume={0}
            monthlyVolume={0}
            weeklyPnl={0}
            totalTrades={0}
          />
        </CardContent>
      </Card>

      {/* Favorite Coin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Favorite Coin
          </CardTitle>
          <CardDescription>
            Your most traded cryptocurrency this month
          </CardDescription>
        </CardHeader>
        <CardContent className="py-10">
        <div className="text-center text-muted-foreground">
          Coming soon
        </div>
      </CardContent>
      </Card>

      {/* Trading Activity Chart Placeholder */}
          <Card>
        <CardHeader>
          <CardTitle>Trading Activity</CardTitle>
          <CardDescription>
            Your trading patterns over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
