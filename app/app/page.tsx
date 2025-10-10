'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenLogo } from '@/components/ui/token-logo';
import { mockTokens, mockUserStats } from '@/lib/mock-data';
import { Map, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { AuraCard } from '@/components/aura-card';

export default function Home() {
  const [auraGenerated, setAuraGenerated] = useState(false);

  const handleGenerateAura = () => {
    setAuraGenerated(true);
    // Simulate aura generation animation
    setTimeout(() => {
      setAuraGenerated(false);
    }, 3000);
  };

  return (
    <div className="py-6 space-y-8">
      {/* Generate Aura Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-center">Your Trading Aura</CardTitle>
          <CardDescription className="text-center">
            Discover your unique trading personality and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuraCard
            score={mockUserStats.tradingAura}
            tags={["Strategic", "Analytical", "Calibrated Risk"]}
            ctaLabel="Generate Your Aura"
            loading={auraGenerated}
            onClick={handleGenerateAura}
          />
        </CardContent>
      </Card>

      {/* Token Holdings Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your Token Holdings</CardTitle>
          <CardDescription>
            Overview of your current portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTokens.map((token) => (
              <div
                key={token.id}
                className="p-4 border rounded-lg transition-colors hover:bg-white/5"
                style={{
                  background:
                    'radial-gradient(160px 90px at 100% -20%, rgba(255,255,255,0.05), rgba(0,0,0,0) 60%)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <TokenLogo symbol={token.symbol} size="lg" />
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">{token.name}</div>
                    </div>
                  </div>
                  <Badge variant={token.change24h >= 0 ? "default" : "destructive"}>
                    {token.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {token.change24h > 0 ? '+' : ''}{token.change24h}%
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold">
                    {token.balance.toFixed(2)} {token.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${token.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shortcut Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <a href="/app/heatmap">
            <Map className="h-6 w-6" />
            <span>Ecosystem Map</span>
          </a>
        </Button>
        <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
          <a href="/app/leaderboard">
            <Trophy className="h-6 w-6" />
            <span>Leaderboard</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
