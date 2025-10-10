'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { leaderboardWithUser } from '@/lib/mock-data';
import { Trophy, TrendingUp, TrendingDown, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('txCount');

  const sortedByTxCount = [...leaderboardWithUser].sort((a, b) => b.txCount - a.txCount);
  const sortedByVolume = [...leaderboardWithUser].sort((a, b) => b.volume - a.volume);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const LeaderboardList = ({ data }: { data: typeof leaderboardWithUser }) => (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div
            key={entry.user.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              entry.user.id === '1' 
                ? 'bg-primary/10 border-primary/20' 
                : 'hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.user.avatar} alt={entry.user.username} />
                <AvatarFallback>{entry.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{entry.user.username}</div>
                <div className="text-xs text-muted-foreground">FID #{entry.user.fid}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">
                {activeTab === 'txCount' 
                  ? entry.txCount.toLocaleString() 
                  : `$${(entry.volume / 1000).toFixed(0)}K`
                }
              </div>
              <Badge 
                variant={entry.change24h >= 0 ? "default" : "destructive"} 
                className="text-xs"
              >
                {entry.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {entry.change24h > 0 ? '+' : ''}{entry.change24h.toFixed(1)}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="py-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Trading Leaderboard
          </CardTitle>
          <CardDescription>
            Top traders ranked by transaction count and volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="txCount">By TX Count</TabsTrigger>
              <TabsTrigger value="volume">By Volume</TabsTrigger>
            </TabsList>
            
            <TabsContent value="txCount" className="mt-6">
              <LeaderboardList data={sortedByTxCount} />
            </TabsContent>
            
            <TabsContent value="volume" className="mt-6">
              <LeaderboardList data={sortedByVolume} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Your Position Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Your Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8">
                {getRankIcon(25)}
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={leaderboardWithUser[24].user.avatar} alt={leaderboardWithUser[24].user.username} />
                <AvatarFallback>{leaderboardWithUser[24].user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{leaderboardWithUser[24].user.username}</div>
                <div className="text-sm text-muted-foreground">{leaderboardWithUser[24].user.basename}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {activeTab === 'txCount' 
                  ? `${leaderboardWithUser[24].txCount} TX`
                  : `$${(leaderboardWithUser[24].volume / 1000).toFixed(0)}K`
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {activeTab === 'txCount' 
                  ? `$${(leaderboardWithUser[24].volume / 1000).toFixed(0)}K volume`
                  : `${leaderboardWithUser[24].txCount} transactions`
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Participants</div>
            <div className="text-2xl font-bold">{leaderboardWithUser.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Top TX Count</div>
            <div className="text-2xl font-bold">{Math.max(...leaderboardWithUser.map(u => u.txCount)).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Top Volume</div>
            <div className="text-2xl font-bold">${(Math.max(...leaderboardWithUser.map(u => u.volume)) / 1000000).toFixed(1)}M</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
