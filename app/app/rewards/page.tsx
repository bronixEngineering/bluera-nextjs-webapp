'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Trophy, Star, CheckCircle } from 'lucide-react';

export default function RewardsPage() {
  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rewards</h1>
        <p className="text-muted-foreground">
          Complete tasks and earn rewards for your trading achievements
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Gift className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">There is nothing to show here</h3>
            <p className="text-sm text-muted-foreground">
              Rewards system is coming soon. Complete trading tasks to earn points and unlock exclusive rewards.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Trading Streaks
            </CardTitle>
            <CardDescription>
              Complete daily trading tasks to build streaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Trade</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Weekly Goal</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Achievement Badges
            </CardTitle>
            <CardDescription>
              Unlock special badges for trading milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">First Trade</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Volume Master</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
