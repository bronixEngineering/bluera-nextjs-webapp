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
import { TokenLogo } from "@/components/ui/token-logo";
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
  Plus,
} from "lucide-react";
import { AuraCard } from "@/components/aura-card";

export default function ProfilePage() {
  const [user, setUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const favoriteToken = mockTokens.find(
    (token) => token.symbol === mockUserStats.favoriteCoin
  );

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

  const handleAddMiniApp = async () => {
    try {
      setIsAdding(true);
      await sdk.actions.addMiniApp();
    } catch (error) {
      console.error("Failed to add mini app:", error);
    } finally {
      setIsAdding(false);
    }
  };

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
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={user?.pfpUrl || mockUser.avatar} 
                  alt={user?.displayName || user?.username || mockUser.username} 
                />
                <AvatarFallback className="text-2xl">
                  {(user?.displayName || user?.username || mockUser.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">
                    {user?.displayName || user?.username || mockUser.username}
                  </h1>
                  <Badge variant="secondary">
                    FID #{user?.fid || mockUser.fid}
                  </Badge>
                </div>
                {user?.username && (
                  <p className="text-muted-foreground mb-2">
                    @{user.username}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">
                    Trading Aura: {mockUserStats.tradingAura}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isInMiniApp && (
                <Button
                  onClick={handleAddMiniApp}
                  disabled={isAdding}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Add to Apps
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Aura Visualization (minimal, dark, light reflection) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Your Trading Aura</CardTitle>
          <CardDescription className="text-center">
            Visual representation of your trading personality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuraCard
            score={mockUserStats.tradingAura}
            tags={["Strategic", "Analytical", "Calibrated Risk"]}
          />
        </CardContent>
      </Card>

      {/* Trading Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Tokens This Month
              </span>
            </div>
            <div className="text-2xl font-bold">
              {mockUserStats.tokensTradedThisMonth}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Total Volume
              </span>
            </div>
            <div className="text-2xl font-bold">
              ${(mockUserStats.totalVolume / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">
                Total Transactions
              </span>
            </div>
            <div className="text-2xl font-bold">
              {mockUserStats.totalTxCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {mockUserStats.pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">P&L</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                mockUserStats.pnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {mockUserStats.pnl > 0 ? "+" : ""}
              {mockUserStats.pnl}%
            </div>
          </CardContent>
        </Card>
      </div>

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
        <CardContent>
          {favoriteToken && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <TokenLogo symbol={favoriteToken.symbol} size="lg" />
                <div>
                  <div className="font-semibold text-lg">
                    {favoriteToken.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {favoriteToken.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {favoriteToken.balance.toFixed(2)} {favoriteToken.symbol}
                </div>
                <Badge
                  variant={
                    favoriteToken.change24h >= 0 ? "default" : "destructive"
                  }
                >
                  {favoriteToken.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {favoriteToken.change24h > 0 ? "+" : ""}
                  {favoriteToken.change24h}%
                </Badge>
              </div>
            </div>
          )}
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
              <p>Trading activity chart would be displayed here</p>
              <p className="text-sm">
                Integration with charting library pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements - Gamified */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Unlock badges as you trade and grow your aura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Badge 1 */}
            <div className="relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/30">
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold">Volume Trader</div>
                  <div className="text-xs text-muted-foreground">
                    Traded over $100K this month
                  </div>
                </div>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/20 ring-2 ring-blue-500/30">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold">Consistent Trader</div>
                  <div className="text-xs text-muted-foreground">
                    Active for 30+ consecutive days
                  </div>
                </div>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-purple-500/20 ring-2 ring-purple-500/30">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold">High Aura</div>
                  <div className="text-xs text-muted-foreground">
                    Aura score above 80
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
