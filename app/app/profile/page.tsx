"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockUser } from "@/lib/mock-data";
import {
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

  const { address, isConnecting } = useAccount();

  // TanStack Query ile holder tag endpoint'ini çağır
  const { data: holderTagData } = useQuery({
    queryKey: ['aura-card-holder-tag', address],
    queryFn: async () => {
      if (!address) return null;
      
      const response = await fetch(`/api/aura-card-holder-tag?wallet=${encodeURIComponent(address)}&network=base`);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch holder tag');
        } else {
          const text = await response.text();
          throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    refetchOnWindowFocus: true,
    staleTime: 60000, // 60 saniye cache (holder tag sık değişmez)
  });

  const holderTag = holderTagData?.holder_tag ? `${holderTagData.holder_tag} Holder` : null;

  // TanStack Query ile wallet-status endpoint'ini çağır (wallet address ile)
  const { data: walletStatusData } = useQuery({
    queryKey: ['wallet-status', address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;

      const wallet = address.toLowerCase();
      const response = await fetch(`/api/wallet-status?wallet=${encodeURIComponent(wallet)}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch wallet status');
        } else {
          const text = await response.text();
          throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 saniye cache
  });

  const allTimeVolumeReal = walletStatusData?.all_time_volume ? Number(walletStatusData.all_time_volume) : 0;

  // TanStack Query ile wallet-token-status endpoint'ini çağır
  const { data: walletTokenStatusData } = useQuery({
    queryKey: ['wallet-token-status', address],
    queryFn: async () => {
      if (!address) return null;
      
      const response = await fetch(`/api/wallet-token-status?wallet=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch wallet token status');
        } else {
          const text = await response.text();
          throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 saniye cache
  });

  const totalTrades = walletTokenStatusData?.totalTrades ? Number(walletTokenStatusData.totalTrades) : 0;

  // TanStack Query ile wallet-token-status-moralis endpoint'ini çağır (wallet_token_status tablosunu güncellemek için)
  const { } = useQuery({
    queryKey: ['wallet-token-status-moralis', address],
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch('/api/wallet-token-status-moralis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address.toLowerCase(),
          // opsiyonel: hours alanını göndermek istersen buraya ekleyebilirsin (default: 24)
          // hours: 24,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed: ${response.status}`);
        } else {
          const text = await response.text();
          throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address && !isConnecting,
    refetchOnWindowFocus: false,
    staleTime: 0, // her mount'ta (sayfa refresh'inde) tekrar çalışsın
  });

  // TanStack Query ile wallet-status-moralis endpoint'ini çağır (veritabanını güncellemek için)
  const { } = useQuery({
    queryKey: ['wallet-status-moralis', address, user?.fid],
    queryFn: async () => {
      if (!address) return null;
      
      const response = await fetch('/api/wallet-status-moralis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          chain: 'base',
          fid: user?.fid ? String(user.fid) : undefined,
        }),
      });

      // Önce status kontrolü
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed: ${response.status}`);
        } else {
          const text = await response.text();
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
      }

      // Başarılı response için Content-Type kontrolü
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address && !isConnecting, // Address var ve bağlanma tamamlandıysa çağır
    refetchOnWindowFocus: false, // Window focus'ta tekrar çağırma (ağır işlem)
    staleTime: 300000, // 5 dakika cache (bu endpoint ağır işlem yapıyor)
  });

  // Yeni useQuery: generate-aura-card endpoint'ini çağır
  const { } = useQuery({
    queryKey: ['generate-aura-card', address],
    queryFn: async () => {
      if (!address) return null;
      
      const response = await fetch('/api/generate-aura-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address.toLowerCase(),
          chain: 'base',
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate aura card');
        } else {
          const text = await response.text();
          throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`API returned non-JSON: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!address && !isConnecting, // Address var ve bağlanma tamamlandıysa çağır
    refetchOnWindowFocus: false, // Window focus'ta tekrar çağırma (ağır işlem)
    staleTime: 300000, // 5 dakika cache (bu endpoint ağır işlem yapıyor)
  });

  // SDK context yükleme - useEffect kalmalı (side effect)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if we're in a Mini App
        const miniAppStatus = await sdk.isInMiniApp();
        setIsInMiniApp(miniAppStatus);

        if (miniAppStatus) {
          // Get context and extract user info
          const context = await sdk.context;
          setUser(context.user);
        }
      } catch (error) {
        // Silently fail
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
            traderTag={allTimeVolumeReal > 1000000 ? "Whale Trader" : ""}
            allTimeVolume={allTimeVolumeReal}
            pnl={0}
            networth={0}
            weeklyVolume={0}
            monthlyVolume={0}
            weeklyPnl={0}
            totalTrades={totalTrades}
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
