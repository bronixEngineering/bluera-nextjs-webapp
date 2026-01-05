'use client';

import { useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, AlertCircle } from 'lucide-react';

interface WalletStats {
  wallet_address: string;
  volume_monthly: number | null;
  net_worth: number | null;
  fid: string | null;
  volume_daily: number | null;
  volume_weekly: number | null;
  all_time_volume: number | null;
  user_name: string | null; // Yeni eklenen
}

interface LeaderboardClientProps {
  initialData: WalletStats[];
  error: string | null;
}

export function LeaderboardClient({ initialData, error }: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState('weeklyVolume');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse drag scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1; // Reduced multiplier for more control
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };


  const formatValue = (value: number | null) => {
    if (!value || value === 0) return '$0.00';
    
    // Handle negative values
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    
    // Cap extremely large values to prevent overflow
    const cappedValue = Math.min(absValue, 1e18);
    
    // Handle very large numbers
    if (cappedValue >= 1e15) {
      // Quadrillions
      const quadrillions = (cappedValue / 1e15).toFixed(2);
      return isNegative ? `-$${quadrillions}Q` : `$${quadrillions}Q`;
    } else if (cappedValue >= 1e12) {
      // Trillions
      const trillions = (cappedValue / 1e12).toFixed(2);
      return isNegative ? `-$${trillions}T` : `$${trillions}T`;
    } else if (cappedValue >= 1e9) {
      // Billions
      const billions = (cappedValue / 1e9).toFixed(2);
      return isNegative ? `-$${billions}B` : `$${billions}B`;
    } else if (cappedValue >= 1e6) {
      // Millions
      const millions = (cappedValue / 1e6).toFixed(2);
      return isNegative ? `-$${millions}M` : `$${millions}M`;
    } else if (cappedValue >= 1e3) {
      // Thousands
      const thousands = (cappedValue / 1e3).toFixed(2);
      return isNegative ? `-$${thousands}K` : `$${thousands}K`;
    } else {
      // Regular numbers
      return isNegative ? `-$${cappedValue.toFixed(2)}` : `$${cappedValue.toFixed(2)}`;
    }
  };

  const sortData = (data: WalletStats[], sortBy: string) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy as keyof WalletStats] as number || 0;
      const bValue = b[sortBy as keyof WalletStats] as number || 0;
      return bValue - aValue;
    });
  };

  const sortedData = useMemo(() => {
    switch (activeTab) {
      case 'allTimeVolume':
        // Artık günlük volume'e göre sıralıyoruz
        return sortData(initialData, 'volume_daily');
      case 'weeklyVolume':
        return sortData(initialData, 'volume_weekly');
      case 'monthlyVolume':
        return sortData(initialData, 'volume_monthly');
      case 'netWorth':
        return sortData(initialData, 'net_worth');
      default:
        return sortData(initialData, 'volume_daily');
    }
  }, [activeTab, initialData]);

  const getValueForTab = (wallet: WalletStats) => {
    switch (activeTab) {
      case 'allTimeVolume':
        // Kartta da günlük volume göster
        return formatValue(wallet.volume_daily);
      case 'weeklyVolume':
        return formatValue(wallet.volume_weekly);
      case 'monthlyVolume':
        return formatValue(wallet.volume_monthly);
      case 'netWorth':
        return formatValue(wallet.net_worth);
      default:
        return formatValue(wallet.volume_daily);
    }
  };

  const avgNetWorth = useMemo(() => {
    const netWorths = initialData
      .map((w) => w.net_worth || 0)
      .filter((nw) => nw > 0);
    const average =
      netWorths.length > 0
        ? netWorths.reduce((sum, nw) => sum + nw, 0) / netWorths.length
        : 0;
    return formatValue(average);
  }, [initialData]);

  if (error) {
    return (
      <div className="py-6 space-y-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      {/* Quick stats (compact) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-500/5 to-transparent p-3">
          <div className="absolute -top-6 -right-6 size-20 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground">Total Traders</div>
              <div className="text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {initialData.length}
              </div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-500/5 to-transparent p-3">
          <div className="absolute -top-6 -right-6 size-20 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground">Avg Net Worth</div>
              <div className="truncate text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {avgNetWorth}
              </div>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide cursor-grab select-none touch-manipulation"
        // Avoid scroll-behavior: smooth here; on iOS webviews it can cause a visible flicker/jump
        // when the active tab styling changes.
        style={{ WebkitOverflowScrolling: 'touch' }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <button
          onClick={() => setActiveTab('allTimeVolume')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center ${
            activeTab === 'allTimeVolume'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Daily Vol
        </button>
        <button
          onClick={() => setActiveTab('weeklyVolume')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center ${
            activeTab === 'weeklyVolume'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Weekly Vol
        </button>
        <button
          onClick={() => setActiveTab('monthlyVolume')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center ${
            activeTab === 'monthlyVolume'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Monthly Vol
        </button>
        <button
          onClick={() => setActiveTab('netWorth')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center ${
            activeTab === 'netWorth'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Net Worth
        </button>
      </div>

      {/* Leaderboard List */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {sortedData.map((wallet, index) => {
                const currentValue = getValueForTab(wallet);
                
                return (
                  <div
                    key={wallet.wallet_address}
                    className="group flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank Badge */}
                      <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                        index === 0 
                          ? "bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 text-yellow-500 border border-yellow-500/50" 
                          : index === 1 
                          ? "bg-gradient-to-br from-gray-400/30 to-gray-500/30 text-gray-300 border border-gray-400/50" 
                          : index === 2 
                          ? "bg-gradient-to-br from-orange-600/30 to-orange-700/30 text-orange-500 border border-orange-600/50" 
                          : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}>
                        {index < 3 ? (
                          <>
                            <Medal className="h-4 w-4" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse" />
                          </>
                        ) : (
                          <span className="text-xs">#{index + 1}</span>
                        )}
                      </div>
                      
                      {/* User Name veya Wallet Address */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {wallet.user_name || `${wallet.wallet_address.slice(0, 6)}...${wallet.wallet_address.slice(-4)}`}
                          </div>
                          {index < 3 && (
                            <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              index === 0 ? 'bg-yellow-500/10 text-yellow-500' :
                              index === 1 ? 'bg-gray-400/10 text-gray-400' :
                              'bg-orange-600/10 text-orange-600'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </div>
                          )}
                        </div>
                        {/* FID satırı kaldırıldı */}
                      </div>
                    </div>
                    
                    {/* Value */}
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-bold">
                        {currentValue}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {sortedData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

