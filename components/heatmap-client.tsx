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

    </div>
  );
}
