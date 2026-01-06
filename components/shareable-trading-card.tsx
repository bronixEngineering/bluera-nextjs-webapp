"use client";

import * as React from "react";

import type { ProfileTag, StatsData } from "@/components/profile-shareable-card";

type Props = {
  stats: StatsData;
  userName?: string;
  userId?: string;
  avatarUrl?: string;
  tags?: ProfileTag[];
};

function proxyImageUrl(url: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function formatNumber(num: number): string {
  const n = Number(num) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatTradesCount(num: number): string {
  const n = Number(num) || 0;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function tagConfig(tag: ProfileTag) {
  switch (tag.kind) {
    case "holder":
      return {
        pill: "bg-cyan-500/10 border-cyan-400/20 text-cyan-100",
      };
    case "whale":
      return {
        pill: "bg-yellow-500/10 border-yellow-400/20 text-yellow-100",
      };
    case "active":
      return {
        pill: "bg-purple-500/20 border-purple-400/20 text-purple-100",
      };
  }
}

export const ShareableTradingCard = React.forwardRef<HTMLDivElement, Props>(
  function ShareableTradingCard(
    { stats, userName = "Trader", userId = "#1234567", avatarUrl, tags = [] },
    ref
  ) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          ref={ref}
          className="relative w-full max-w-[520px] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl"
        >
          <div className="relative rounded-[22px] bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-900 p-6 backdrop-blur-xl sm:p-8">
            {/* Header */}
            <div className="relative z-10 mb-5 flex items-center gap-4 sm:mb-7 sm:gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-75 blur" />
                <div className="relative size-20 overflow-hidden rounded-full border-4 border-gray-800 bg-gradient-to-br from-purple-500 to-pink-500 sm:size-24">
                  {avatarUrl ? (
                    // Using <img> for more predictable html2canvas capture (CORS best-effort)
                    <img
                      src={proxyImageUrl(avatarUrl)}
                      alt={userName}
                      className="size-full object-cover"
                      crossOrigin="anonymous"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                      <span className="text-xl font-semibold text-white sm:text-2xl">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* User details */}
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 truncate bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl">
                  {userName}
                </h2>
                <p className="text-sm text-gray-400 sm:text-base">FID {userId}</p>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {tags.map((t) => {
                      const cfg = tagConfig(t);
                      return (
                        <div
                          key={`${t.kind}:${t.label}`}
                          className={`flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cfg.pill}`}
                        >
                          <span className="truncate">{t.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Coins */}
            <div className="relative z-10 mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4">
              <div className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      Daily Fav by Volume
                    </p>
                    <p className="mb-1 truncate bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-lg font-semibold text-transparent sm:text-2xl">
                      {(stats.favCoinByVolume?.volume ?? 0) > 0
                        ? (stats.favCoinByVolume?.symbol ?? "$—")
                        : ""}
                    </p>
                    <p className="text-sm text-gray-400 sm:text-base">
                      {(stats.favCoinByVolume?.volume ?? 0) > 0 ? (
                        formatNumber(stats.favCoinByVolume?.volume ?? 0)
                      ) : (
                        <span className="block text-[11px] leading-snug text-gray-300 sm:text-sm">
                          No volume today — make a trade to unlock your daily fav.
                        </span>
                      )}
                    </p>
                  </div>

                  {stats.favCoinByVolume?.imageUrl &&
                  (stats.favCoinByVolume?.volume ?? 0) > 0 ? (
                    <div className="size-10 shrink-0 overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 sm:size-11">
                      <img
                        src={proxyImageUrl(stats.favCoinByVolume.imageUrl)}
                        alt={stats.favCoinByVolume.symbol}
                        className="size-full object-cover"
                        crossOrigin="anonymous"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          // Fallback: hide broken image so we don't show a broken icon
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Daily Fav by Trades
                    </p>
                    <p className="mb-1 truncate bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-lg font-semibold text-transparent sm:text-2xl">
                      {(stats.favCoinByTrades?.trades ?? 0) > 0
                        ? (stats.favCoinByTrades?.symbol ?? "$—")
                        : ""}
                    </p>
                    <p className="text-sm text-gray-400 sm:text-base">
                      {(stats.favCoinByTrades?.trades ?? 0) > 0 ? (
                        <>
                          {formatTradesCount(stats.favCoinByTrades?.trades ?? 0)} trades
                        </>
                      ) : (
                        <span className="block text-[11px] leading-snug text-gray-300 sm:text-sm">
                          No trades today, be more active to unlock your daily fav.
                        </span>
                      )}
                    </p>
                  </div>

                  {stats.favCoinByTrades?.imageUrl &&
                  (stats.favCoinByTrades?.trades ?? 0) > 0 ? (
                    <div className="size-10 shrink-0 overflow-hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 sm:size-11">
                      <img
                        src={proxyImageUrl(stats.favCoinByTrades.imageUrl)}
                        alt={stats.favCoinByTrades.symbol}
                        className="size-full object-cover"
                        crossOrigin="anonymous"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-3.5 backdrop-blur-sm sm:p-6">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-purple-500/20 blur-2xl" />
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-300 sm:text-xs">
                    Daily
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400 sm:text-sm">Volume</p>
                  <p className="mt-1 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
                    {formatNumber(stats.daily.volume)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 sm:text-base">
                    {formatTradesCount(stats.daily.trades)} trades
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/20 via-pink-500/10 to-transparent p-3.5 backdrop-blur-sm sm:p-6">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-pink-500/20 blur-2xl" />
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-pink-300 sm:text-xs">
                    Weekly
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400 sm:text-sm">Volume</p>
                  <p className="mt-1 bg-gradient-to-r from-pink-200 to-blue-200 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
                    {formatNumber(stats.weekly.volume)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 sm:text-base">
                    {formatTradesCount(stats.weekly.trades)} trades
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-3.5 backdrop-blur-sm sm:p-6">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-blue-500/20 blur-2xl" />
                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300 sm:text-xs">
                    Monthly
                  </p>
                  <p className="mt-2 text-[11px] text-gray-400 sm:text-sm">Volume</p>
                  <p className="mt-1 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
                    {formatNumber(stats.monthly.volume)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 sm:text-base">
                    {formatTradesCount(stats.monthly.trades)} trades
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-6 flex items-center justify-between border-t border-gray-700/50 pt-5 sm:mt-8 sm:pt-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-10 shrink-0 rounded-xl bg-gray-800/50 p-2 backdrop-blur-sm sm:size-12">
                  <img
                    src="/original.webp"
                    alt="Bluera"
                    className="size-full object-contain"
                    crossOrigin="anonymous"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-xl font-bold leading-none text-transparent sm:text-2xl">
                    Bluera
                  </span>
                </div>
              </div>
              <p className="shrink-0 text-[11px] text-gray-500 sm:text-sm">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);


