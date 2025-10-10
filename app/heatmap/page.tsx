/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TokenLogo } from "@/components/ui/token-logo";
import { mockHeatmapData } from "@/lib/mock-data";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

export default function HeatmapPage() {
  // Transform data for Recharts Treemap
  const treemapData = mockHeatmapData.map((coin) => ({
    name: coin.symbol,
    size: coin.volume,
    fill: coin.color,
    change24h: coin.change24h,
    volume: coin.volume,
    txCount: coin.txCount,
  }));

  const totalVolume = mockHeatmapData.reduce(
    (sum, coin) => sum + coin.volume,
    0
  );
  const topPerformer = mockHeatmapData.reduce((top, coin) =>
    coin.change24h > top.change24h ? coin : top
  );

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Cryptocurrency Volume Heatmap</CardTitle>
          <CardDescription>
            Visual representation of trading volumes across different
            cryptocurrencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recharts Treemap */}
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#1e293b"
                  fill="#334155"
                  content={(props) => {
                    const { x, y, width, height, index } = props as any;
                    const coin = treemapData[index];

                    if (!coin || width < 60 || height < 40) return <g />;

                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={coin.fill}
                          stroke="#1e293b"
                          strokeWidth={2}
                          rx={4}
                        />
                        <text
                          x={x + 12}
                          y={y + 24}
                          fill="#ffffff"
                          stroke="none"
                          fontSize="16"
                          fontWeight="700"
                        >
                          {coin.name}
                        </text>
                        {width > 100 && height > 60 && (
                          <>
                            <text
                              x={x + 12}
                              y={y + 44}
                              fill="#ffffff"
                              stroke="none"
                              fontSize="12"
                              fontWeight="600"
                              opacity="0.9"
                            >
                              ${(coin.volume / 1000000).toFixed(1)}M
                            </text>
                            <text
                              x={x + 12}
                              y={y + 62}
                              fill="#ffffff"
                              stroke="none"
                              fontSize="11"
                              fontWeight="500"
                              opacity="0.8"
                            >
                              {coin.change24h > 0 ? "+" : ""}
                              {coin.change24h}%
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                >
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-4 shadow-lg min-w-[200px]">
                            <div className="flex items-center gap-3 mb-3">
                              <TokenLogo symbol={data.name} size="md" />
                              <div>
                                <div className="font-semibold text-lg">
                                  {data.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Trading Volume
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Volume:
                                </span>
                                <span className="font-semibold">
                                  ${(data.volume / 1000000).toFixed(1)}M
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Transactions:
                                </span>
                                <span className="font-semibold">
                                  {data.txCount?.toLocaleString() || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  24h Change:
                                </span>
                                <div
                                  className={`flex items-center gap-1 font-semibold ${
                                    data.change24h >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {data.change24h >= 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {data.change24h > 0 ? "+" : ""}
                                  {data.change24h}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>

            {/* Volume Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Volume
                </div>
                <div className="text-2xl font-bold">
                  ${(totalVolume / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Top Performer
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {topPerformer.symbol} {topPerformer.change24h > 0 ? "+" : ""}
                  {topPerformer.change24h}%
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Active Coins
                </div>
                <div className="text-2xl font-bold">
                  {mockHeatmapData.length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volume Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockHeatmapData.slice(0, 5).map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <TokenLogo
                      symbol={coin.symbol}
                      size="sm"
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">{coin.symbol}</span>
                    <Badge
                      variant={coin.change24h >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {coin.change24h > 0 ? "+" : ""}
                      {coin.change24h}%
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold">
                    ${(coin.volume / 1000000).toFixed(1)}M
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  Bullish Trend
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  7 out of 10 coins showing positive momentum
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  High Activity
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Trading volume up 15% from yesterday
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
