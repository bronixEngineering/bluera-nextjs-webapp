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
  const [isGeneratingAura, setIsGeneratingAura] = useState(false);
  const [showAuraModal, setShowAuraModal] = useState(false);

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

  // Aura card için artık günlük volume kullan (all_time yerine volume_daily)
  const dailyVolumeReal = walletStatusData?.volume_daily ? Number(walletStatusData.volume_daily) : 0;

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

  const dailyTrades = walletTokenStatusData?.dailyTrades ? Number(walletTokenStatusData.dailyTrades) : 0;
  const weeklyTrades = walletTokenStatusData?.weeklyTrades ? Number(walletTokenStatusData.weeklyTrades) : 0;
  const monthlyTrades = walletTokenStatusData?.monthlyTrades ? Number(walletTokenStatusData.monthlyTrades) : 0;

  // TanStack Query ile wallet-token-status-moralis endpoint'ini çağır (wallet_token_status tablosunu güncellemek için)
  const { } = useQuery({
    queryKey: ['wallet-token-status-mobula', address],
    queryFn: async () => {
      if (!address) return null;

      const response = await fetch('/api/wallet-token-status-mobula', {
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

  // TanStack Query ile wallet-status-mobula endpoint'ini çağır (veritabanını güncellemek için)
  const { } = useQuery({
    queryKey: ['wallet-status-mobula', address, user?.fid],
    queryFn: async () => {
      if (!address) return null;
      
      const response = await fetch('/api/wallet-status-mobula', {
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
    // Address + FID hazırsa ve cüzdan bağlantısı tamamlanmışsa çalıştır
    enabled: !!address && !isConnecting && !!user?.fid,
    refetchOnWindowFocus: false, // Window focus'ta tekrar çağırma (ağır işlem)
    staleTime: 300000, // 5 dakika cache (bu endpoint ağır işlem yapıyor)
  });

  async function handleGenerateAuraCard() {
    if (!address || isConnecting) return;
    try {
      setIsGeneratingAura(true);
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

      await response.json();
      setShowAuraModal(true);
    } catch (err) {
      console.error('Failed to generate aura card', err);
      alert('Failed to generate aura card. Please try again.');
    } finally {
      setIsGeneratingAura(false);
    }
  }

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
        <CardContent className="border-none bg-transparent space-y-4">
          <ShareableAuraCard
            username={user?.username || mockUser.username}
            fid={user?.fid || mockUser.fid}
            pfpUrl={user?.pfpUrl || mockUser.avatar}
            holderTag={holderTag || ""}
            traderTag={dailyVolumeReal > 100000 ? "Whale Trader" : ""}
            activeTraderTag={dailyTrades > 0 ? "Active Base Trader" : ""}
            allTimeVolume={dailyVolumeReal}
            networth={0}
            weeklyVolume={0}
            monthlyVolume={0}
            dailyTrades={dailyTrades}
            weeklyTrades={weeklyTrades}
            monthlyTrades={monthlyTrades}
            showActions={false}
          />
          <div className="flex justify-center">
            <button
              onClick={handleGenerateAuraCard}
              disabled={!address || isConnecting || isGeneratingAura}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isGeneratingAura ? 'Generating...' : 'Generate Your Aura Card'}
            </button>
          </div>
        </CardContent>
      </Card>
      
      {showAuraModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setShowAuraModal(false)}
        >
          <div
            className="bg-background rounded-2xl p-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ShareableAuraCard
              username={user?.username || mockUser.username}
              fid={user?.fid || mockUser.fid}
              pfpUrl={user?.pfpUrl || mockUser.avatar}
              holderTag={holderTag || ""}
              traderTag={dailyVolumeReal > 100000 ? "Whale Trader" : ""}
              activeTraderTag={dailyTrades > 0 ? "Active Base Trader" : ""}
              allTimeVolume={dailyVolumeReal}
              networth={0}
              weeklyVolume={0}
              monthlyVolume={0}
              dailyTrades={dailyTrades}
              weeklyTrades={weeklyTrades}
              monthlyTrades={monthlyTrades}
              showActions={true}
              mode="modal"
            />
          </div>
        </div>
      )}

    </div>
  );
}
