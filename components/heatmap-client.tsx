/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";

interface HeatmapToken {
  token_address: string;
  symbol: string;
  volume: number;
  swaps: number;
  change24h: number;
  image_url?: string;
  token_type?: string;
  color: string;
}

interface HeatmapClientProps {
  initialData: HeatmapToken[];
  totalVolume: number;
  isLoading: boolean;
  error: string | null;
}

export function HeatmapClient({
  initialData,
  totalVolume: _totalVolume,
  isLoading,
  error,
}: HeatmapClientProps) {
  // totalVolume is available but not used in this component
  void _totalVolume;
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTokenClick = (tokenAddress: string) => {
    router.push(`/app/token/${tokenAddress}`);
  };
  // Transform data for Recharts Treemap with linear scaling across top 20 tokens
  const topTokens = [...initialData]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20);
  const volumes = topTokens.map((t) => t.volume);
  const maxVolume = Math.max(...volumes);
  const minVolume = Math.min(...volumes);

  // Define min/max weight (tile area) for visual balance
  const MIN_WEIGHT = 12;
  const MAX_WEIGHT = 35;

  const toWeight = (v: number) => {
    if (maxVolume === minVolume) return (MIN_WEIGHT + MAX_WEIGHT) / 2;
    const ratio = (v - minVolume) / (maxVolume - minVolume);
    return MIN_WEIGHT + ratio * (MAX_WEIGHT - MIN_WEIGHT);
  };

  const treemapData = topTokens.map((token) => ({
    name: token.symbol,
    size: toWeight(token.volume),
    fill: token.color,
    change24h: token.change24h,
    volume: token.volume,
    swaps: token.swaps,
    token_address: token.token_address,
    image_url: token.image_url,
  }));

  const topPerformer = initialData.reduce(
    (top, token) => (token.change24h > top.change24h ? token : top),
    initialData[0] || { change24h: 0, symbol: "N/A" }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card className="p-0">
          <CardContent className="p-0">
            <div className="h-[600px] w-full flex items-center justify-center p-6">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading heatmap data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-6 space-y-8">
        <Card>
          <CardContent className="p-0">
            <div className="h-[600px] w-full flex items-center justify-center p-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8">
      <Card className="mx-0">
        <CardContent className="p-0">
          <div className="space-y-4 px-6">
            {/* Recharts Treemap */}
            <div className="h-[600px] w-full max-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  stroke="#1e293b"
                  fill="#334155"
                  isAnimationActive={false}
                  aspectRatio={4 / 3}
                  content={(props) => {
                    const { x, y, width, height, index } = props as any;
                    const coin = treemapData[index];

                    if (!coin || width < 10 || height < 8) return <g />;

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
                          style={{ cursor: "pointer" }}
                          onClick={() => handleTokenClick(coin.token_address)}
                        />
                        {/* Token image from backend (if provided) */}
                        {(() => {
                          const imgUrl = coin.image_url;
                          if (!imgUrl || width < 50) return null;
                          const iconSize = Math.max(
                            14,
                            Math.min(20, Math.min(width, height) * 0.25)
                          );
                          // If tile width is narrow, place icon bottom-right; else top-right
                          const narrowThreshold = 80;
                          const iconX = x + width - iconSize - 8;
                          const iconY =
                            width < narrowThreshold
                              ? y + height - iconSize - 8
                              : y + 8;
                          const cx = iconX + iconSize / 2;
                          const cy = iconY + iconSize / 2;
                          return (
                            <>
                              {/* Soft background for visibility */}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={iconSize / 2 + 2}
                                fill="rgba(255, 255, 255, 0.9)"
                              />
                              <image
                                href={imgUrl}
                                x={iconX}
                                y={iconY}
                                width={iconSize}
                                height={iconSize}
                                preserveAspectRatio="xMidYMid meet"
                                clipPath={`circle(${iconSize / 2}px at ${
                                  iconSize / 2
                                }px ${iconSize / 2}px)`}
                              />
                            </>
                          );
                        })()}
                        <text
                          x={x + 6}
                          y={y + 16}
                          fill="#ffffff"
                          stroke="none"
                          fontSize={width < 60 ? "8" : "12"}
                          fontWeight="900"
                        >
                          {coin.name}
                        </text>
                        {width > 40 && height > 30 && (
                          <>
                            <text
                              x={x + 6}
                              y={y + 32}
                              fill="#ffffff"
                              stroke="none"
                              fontSize={width < 60 ? "8" : "13"}
                              fontWeight="800"
                              opacity="0.9"
                            >
                              {coin.volume >= 1000000
                                ? `$${(coin.volume / 1000000).toFixed(1)}M`
                                : `$${(coin.volume / 1000).toFixed(0)}K`}
                            </text>
                            {height > 55 && (
                              <text
                                x={x + 6}
                                y={y + 44}
                                fill="#ffffff"
                                stroke="none"
                                fontSize={width < 60 ? "8" : "11"}
                                fontWeight="700"
                                opacity="0.85"
                              >
                                Swaps:{" "}
                                {coin.swaps >= 1000
                                  ? `${(coin.swaps / 1000).toFixed(1)}K`
                                  : coin.swaps?.toString()}
                              </text>
                            )}
                            <text
                              x={x + 6}
                              y={y + (height > 55 ? 58 : 46)}
                              fill="#ffffff"
                              stroke="none"
                              fontSize={width < 60 ? "7" : "12"}
                              fontWeight="700"
                              opacity="0.8"
                            >
                              {coin.change24h > 0 ? "+" : ""}
                              {coin.change24h.toFixed(3)}%
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
                          <div className="bg-background border rounded-lg p-4 shadow-lg min-w-[220px]">
                            <div className="mb-3 flex items-center gap-3">
                              {data.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={data.image_url}
                                  alt={`${data.name} icon`}
                                  className="w-6 h-6 rounded-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : null}
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
                                  {data.volume >= 1000000
                                    ? `$${(data.volume / 1000000).toFixed(1)}M`
                                    : `$${(data.volume / 1000).toFixed(0)}K`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Swaps:
                                </span>
                                <span className="font-semibold">
                                  {data.swaps?.toLocaleString() || "N/A"}
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
                                  {data.change24h.toFixed(3)}%
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
            <div className="space-y-1">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 py-2 px-3 text-xs font-medium text-muted-foreground border-b">
                <div className="col-span-4">Token</div>
                <div className="col-span-3 text-center">Change</div>
                <div className="col-span-3 text-center">Volume</div>
                <div className="col-span-2 text-center">Swaps</div>
              </div>

              {/* Table Rows */}
              {topTokens.slice(0, 8).map((token, index) => (
                <div
                  key={token.token_address}
                  className="grid grid-cols-12 gap-4 py-3 px-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium">{token.symbol}</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <Badge
                      variant={
                        token.change24h > 0
                          ? "default"
                          : token.change24h < 0
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {token.change24h > 0 ? "+" : ""}
                      {token.change24h.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="col-span-3 text-center text-sm font-semibold">
                    {token.volume >= 1000000
                      ? `$${(token.volume / 1000000).toFixed(1)}M`
                      : `$${(token.volume / 1000).toFixed(0)}K`}
                  </div>
                  <div className="col-span-2 text-center text-xs text-muted-foreground">
                    {token.swaps >= 1000
                      ? `${(token.swaps / 1000).toFixed(1)}K`
                      : token.swaps?.toLocaleString()}
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
              {/* Market Sentiment */}
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  Market Sentiment
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  {Math.round(
                    (topTokens.filter((t) => t.change24h > 0).length /
                      topTokens.length) *
                      100
                  )}
                  % of top tokens in positive territory (
                  {topTokens.filter((t) => t.change24h > 0).length}/
                  {topTokens.length})
                </div>
              </div>

              {/* Top Performer */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Top Performer
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  {topPerformer.symbol} leading with{" "}
                  {topPerformer.change24h > 0 ? "+" : ""}
                  {topPerformer.change24h.toFixed(3)}% change
                </div>
              </div>

              {/* Volume Leader */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Volume Leader
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {topTokens[0]?.symbol} with $
                  {topTokens[0]?.volume >= 1000000
                    ? `${(topTokens[0].volume / 1000000).toFixed(1)}M`
                    : `${(topTokens[0].volume / 1000).toFixed(0)}K`}{" "}
                  volume
                </div>
              </div>

              {/* Most Active */}
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Most Active
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  {
                    topTokens.reduce(
                      (max, token) => (token.swaps > max.swaps ? token : max),
                      topTokens[0]
                    )?.symbol
                  }{" "}
                  with{" "}
                  {topTokens
                    .reduce(
                      (max, token) => (token.swaps > max.swaps ? token : max),
                      topTokens[0]
                    )
                    ?.swaps?.toLocaleString()}{" "}
                  swaps
                </div>
              </div>

              {/* Biggest Loser */}
              {(() => {
                const biggestLoser = topTokens.reduce(
                  (worst, token) =>
                    token.change24h < worst.change24h ? token : worst,
                  topTokens[0] || { change24h: 0, symbol: "N/A" }
                );
                return biggestLoser.change24h < 0 ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200">
                      Biggest Decline
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {biggestLoser.symbol} down{" "}
                      {Math.abs(biggestLoser.change24h).toFixed(3)}%
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
