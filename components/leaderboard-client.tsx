'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, AlertCircle, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

interface WalletStats {
  wallet_address: string;
  volume_monthly: number | null;
  net_worth: number | null;
  weekly_pnl: number | null;
  fid: string | null;
  volume_daily: number | null;
  volume_weekly: number | null;
  monthly_pnl: number | null;
  all_time_volume: number | null;
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
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

  const getTabData = () => {
    switch (activeTab) {
      case 'allTimeVolume':
        return sortData(initialData, 'all_time_volume');
      case 'weeklyVolume':
        return sortData(initialData, 'volume_weekly');
      case 'monthlyVolume':
        return sortData(initialData, 'volume_monthly');
      case 'weeklyPnl':
        return sortData(initialData, 'weekly_pnl');
      case 'monthlyPnl':
        return sortData(initialData, 'monthly_pnl');
      case 'netWorth':
        return sortData(initialData, 'net_worth');
      default:
        return sortData(initialData, 'all_time_volume');
    }
  };

  const getValueForTab = (wallet: WalletStats) => {
    switch (activeTab) {
      case 'allTimeVolume':
        return formatValue(wallet.all_time_volume);
      case 'weeklyVolume':
        return formatValue(wallet.volume_weekly);
      case 'monthlyVolume':
        return formatValue(wallet.volume_monthly);
      case 'weeklyPnl':
        return formatValue(wallet.weekly_pnl);
      case 'monthlyPnl':
        return formatValue(wallet.monthly_pnl);
      case 'netWorth':
        return formatValue(wallet.net_worth);
      default:
        return formatValue(wallet.all_time_volume);
    }
  };

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

  const sortedData = getTabData();

  return (
    <div className="py-6 space-y-8">
      <Card>
        <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Leaderboard
                </CardTitle>
          <CardDescription>
            Top traders ranked by volume, PnL, and net worth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div 
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide cursor-grab select-none" 
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              <button
                onClick={() => setActiveTab('allTimeVolume')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'allTimeVolume'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Trophy className="h-4 w-4" />
                All-Time Vol
              </button>
              <button
                onClick={() => setActiveTab('weeklyVolume')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'weeklyVolume'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Weekly Vol
              </button>
              <button
                onClick={() => setActiveTab('monthlyVolume')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'monthlyVolume'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Monthly Vol
              </button>
              <button
                onClick={() => setActiveTab('weeklyPnl')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'weeklyPnl'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Weekly PnL
              </button>
              <button
                onClick={() => setActiveTab('monthlyPnl')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'monthlyPnl'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Monthly PnL
              </button>
              <button
                onClick={() => setActiveTab('netWorth')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'netWorth'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Net Worth
              </button>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {sortedData.map((wallet, index) => {
                  const currentValue = getValueForTab(wallet);
                  const isPnlTab = activeTab === 'weeklyPnl' || activeTab === 'monthlyPnl';
                  const pnlValue = activeTab === 'weeklyPnl' ? wallet.weekly_pnl : wallet.monthly_pnl;
                  
                  return (
                    <div
                      key={wallet.wallet_address}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors min-h-[40px]"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-6 flex-shrink-0">
                          {index < 3 ? getRankIcon(index + 1) : <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>}
                        </div>
                        <div className="font-mono text-xs truncate">
                          {wallet.wallet_address.slice(0, 4)}...{wallet.wallet_address.slice(-4)}
                        </div>
                      </div>
                      <div className={`text-sm font-semibold whitespace-nowrap ml-2 ${isPnlTab && pnlValue !== null && pnlValue !== 0 ? (pnlValue >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                        {currentValue}
                      </div>
                    </div>
                  );
                })}
                
                {sortedData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Traders</div>
            <div className="text-2xl font-bold">{initialData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Profitable Traders</div>
            <div className="text-2xl font-bold">
              {(() => {
                const profitableCount = initialData.filter(w => 
                  (w.weekly_pnl && w.weekly_pnl > 0) || 
                  (w.monthly_pnl && w.monthly_pnl > 0)
                ).length;
                const percentage = initialData.length > 0 ? Math.round((profitableCount / initialData.length) * 100) : 0;
                return `${profitableCount} (${percentage}%)`;
              })()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Average Net Worth</div>
            <div className="text-2xl font-bold">
              {(() => {
                const netWorths = initialData
                  .map(w => w.net_worth || 0)
                  .filter(nw => nw > 0);
                const average = netWorths.length > 0 
                  ? netWorths.reduce((sum, nw) => sum + nw, 0) / netWorths.length 
                  : 0;
                return formatValue(average);
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

