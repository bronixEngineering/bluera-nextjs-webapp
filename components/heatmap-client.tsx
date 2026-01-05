/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";

type HeatmapMetric = "volume" | "swaps" | "price";

interface HeatmapToken {
  token_address: string;
  symbol: string;
  liquidityUsd: number;
  volume24h: number;
  swaps24h: number;
  priceUsd: number;
  volumeChangePct24h: number;
  swapsChangePct24h: number;
  priceChangePct24h: number;
  image_url?: string;
  token_type?: string;
}

interface HeatmapClientProps {
  initialData: HeatmapToken[];
  isLoading: boolean;
  error: string | null;
}

export function HeatmapClient({
  initialData,
  isLoading,
  error,
}: HeatmapClientProps) {
  const router = useRouter();
  const [metric, setMetric] = React.useState<HeatmapMetric>("volume");
  const TOP_N = 15;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTokenClick = (tokenAddress: string) => {
    router.push(`/app/token/${tokenAddress}`);
  };
  const topTokens = React.useMemo(
    () => [...initialData].sort((a, b) => b.liquidityUsd - a.liquidityUsd).slice(0, TOP_N),
    [TOP_N, initialData]
  );
  const liquidityVals = topTokens.map((t) => t.liquidityUsd);
  const maxLiq = Math.max(...liquidityVals, 0);
  const minLiq = Math.min(...liquidityVals, 0);

  // Define min/max weight (tile area) for visual balance
  const MIN_WEIGHT = 12;
  const MAX_WEIGHT = 35;

  const toWeight = (v: number) => {
    if (maxLiq === minLiq) return (MIN_WEIGHT + MAX_WEIGHT) / 2;
    const ratio = (v - minLiq) / (maxLiq - minLiq);
    return MIN_WEIGHT + ratio * (MAX_WEIGHT - MIN_WEIGHT);
  };

  const getChangePct = (t: HeatmapToken) => {
    if (metric === "volume") return t.volumeChangePct24h;
    if (metric === "swaps") return t.swapsChangePct24h;
    return t.priceChangePct24h;
  };

  const colorForChangePct = (changePct: number): string => {
    if (!Number.isFinite(changePct) || changePct === 0) return "hsl(0, 0%, 45%)";
    const intensity = Math.min(Math.abs(changePct) / 50, 1);
    if (changePct > 0) {
      const hue = 140 + intensity * 20;
      const saturation = Math.min(60, 30 + intensity * 30);
      const lightness = Math.max(35, 55 - intensity * 20);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    const hue = 0;
    const saturation = Math.min(70, 40 + intensity * 30);
    const lightness = Math.max(35, 55 - intensity * 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const treemapData = topTokens.map((token) => {
    const changePct = getChangePct(token);
    return {
      name: token.symbol,
      size: toWeight(token.liquidityUsd),
      fill: colorForChangePct(changePct),
      changePct,
      liquidityUsd: token.liquidityUsd,
      volume24h: token.volume24h,
      swaps24h: token.swaps24h,
      priceUsd: token.priceUsd,
      token_address: token.token_address,
      image_url: token.image_url,
    };
  });

  const formatUsdCompact = (v: number) => {
    if (!Number.isFinite(v)) return "$0";
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(2)}`;
  };

  const formatCountCompact = (v: number) => {
    if (!Number.isFinite(v)) return "0";
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return `${Math.round(v)}`;
  };

  const labelForMetric = (m: HeatmapMetric, compact: boolean) => {
    if (m === "volume") return compact ? "Vol" : "Volume";
    if (m === "swaps") return "Swaps"; // already short
    return compact ? "Price" : "Price";
  };

  const safeSvgId = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

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
      {/* Mode selector (Leaderboard style) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide cursor-grab select-none touch-manipulation">
        <button
          onClick={() => setMetric("volume")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            metric === "volume"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          24h Volume
        </button>
        <button
          onClick={() => setMetric("swaps")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            metric === "swaps"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          24h Swaps
        </button>
        <button
          onClick={() => setMetric("price")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            metric === "price"
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          24h Price
        </button>
      </div>

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

                    const imgUrl = coin.image_url as string | undefined;
                    // Place icon bottom-right (away from the top-left text block).
                    // With this placement we can show icons on smaller tiles too.
                    const showIcon = Boolean(imgUrl) && width >= 55 && height >= 55;
                    const iconSize = showIcon
                      ? Math.max(14, Math.min(20, Math.min(width, height) * 0.22))
                      : 0;
                    // Text sits in the top-left; no need to reserve right space anymore.
                    const reservedRight = 8;
                    const clipId = `heatmap-clip-${safeSvgId(String(coin.token_address || index))}`;
                    const iconClipId = `heatmap-icon-clip-${safeSvgId(String(coin.token_address || index))}`;
                    const compactLabel = width < 115;
                    const metricLabel = labelForMetric(metric, compactLabel);

                    return (
                      <g>
                        <defs>
                          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                            <rect
                              x={x + 4}
                              y={y + 4}
                              width={Math.max(0, width - reservedRight)}
                              height={Math.max(0, height - 8)}
                              rx={4}
                              ry={4}
                            />
                          </clipPath>
                          {showIcon ? (
                            <clipPath id={iconClipId} clipPathUnits="userSpaceOnUse">
                              <circle
                                cx={x + width - 10 - iconSize / 2}
                                cy={y + height - 10 - iconSize / 2}
                                r={iconSize / 2}
                              />
                            </clipPath>
                          ) : null}
                        </defs>
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
                          if (!showIcon || !imgUrl) return null;
                          const iconX = x + width - iconSize - 10;
                          const iconY = y + height - iconSize - 10; // bottom-right to avoid text overlap
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
                                clipPath={`url(#${iconClipId})`}
                              />
                            </>
                          );
                        })()}
                        <g clipPath={`url(#${clipId})`}>
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
                                {metric === "volume"
                                  ? `${metricLabel}: ${formatUsdCompact(Number(coin.volume24h || 0))}`
                                  : metric === "swaps"
                                    ? `${metricLabel}: ${formatCountCompact(Number(coin.swaps24h || 0))}`
                                    : metric === "price"
                                      ? `${metricLabel}: $${Number(coin.priceUsd || 0).toFixed(4)}`
                                      : ""}
                              </text>
                              <text
                                x={x + 6}
                                y={y + 46}
                                fill="#ffffff"
                                stroke="none"
                                fontSize={width < 60 ? "7" : "12"}
                                fontWeight="700"
                                opacity="0.8"
                              >
                                {coin.changePct > 0 ? "+" : ""}
                                {coin.changePct.toFixed(2)}%
                              </text>
                            </>
                          )}
                        </g>
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
                                  {metric === "volume"
                                    ? "24h Volume"
                                    : metric === "swaps"
                                      ? "24h Swaps"
                                      : "Price"}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Value:
                                </span>
                                <span className="font-semibold">
                                  {metric === "volume"
                                    ? data.volume24h >= 1000000
                                      ? `$${(data.volume24h / 1000000).toFixed(1)}M`
                                      : `$${(data.volume24h / 1000).toFixed(0)}K`
                                    : metric === "swaps"
                                      ? Number(data.swaps24h || 0).toLocaleString()
                                      : `$${Number(data.priceUsd || 0).toFixed(4)}`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  24h Change:
                                </span>
                                <div
                                  className={`flex items-center gap-1 font-semibold ${
                                    data.changePct >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {data.changePct > 0 ? "+" : ""}
                                  {Number(data.changePct).toFixed(2)}%
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
