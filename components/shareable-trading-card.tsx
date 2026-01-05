"use client";

import * as React from "react";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

import type { ProfileTag, StatsData } from "@/components/profile-shareable-card";

type Props = {
  stats: StatsData;
  userName?: string;
  userId?: string;
  avatarUrl?: string;
  tags?: ProfileTag[];
};

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
        Icon: Sparkles,
        pill: "bg-cyan-500/10 border-cyan-400/20 text-cyan-100",
        icon: "text-cyan-300",
      };
    case "whale":
      return {
        Icon: Zap,
        pill: "bg-yellow-500/10 border-yellow-400/20 text-yellow-100",
        icon: "text-yellow-300",
      };
    case "active":
      return {
        Icon: TrendingUp,
        pill: "bg-purple-500/20 border-purple-400/20 text-purple-100",
        icon: "text-purple-300",
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
                      src={avatarUrl}
                      alt={userName}
                      className="size-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
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
                          className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${cfg.pill}`}
                        >
                          <cfg.Icon className={`size-3 ${cfg.icon}`} />
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
                      Fav by Volume
                    </p>
                    <p className="mb-1 truncate bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-lg font-semibold text-transparent sm:text-2xl">
                      {stats.favCoinByVolume?.symbol ?? "$—"}
                    </p>
                    <p className="text-sm text-gray-400 sm:text-base">
                      {formatNumber(stats.favCoinByVolume?.volume ?? 0)}
                    </p>
                  </div>

                  {stats.favCoinByVolume?.imageUrl ? (
                    <div className="size-10 shrink-0 overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 sm:size-11">
                      <img
                        src={stats.favCoinByVolume.imageUrl}
                        alt={stats.favCoinByVolume.symbol}
                        className="size-full object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Fav by Trades
                    </p>
                    <p className="mb-1 truncate bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-lg font-semibold text-transparent sm:text-2xl">
                      {stats.favCoinByTrades?.symbol ?? "$—"}
                    </p>
                    <p className="text-sm text-gray-400 sm:text-base">
                      {formatTradesCount(stats.favCoinByTrades?.trades ?? 0)} trades
                    </p>
                  </div>

                  {stats.favCoinByTrades?.imageUrl ? (
                    <div className="size-10 shrink-0 overflow-hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 sm:size-11">
                      <img
                        src={stats.favCoinByTrades.imageUrl}
                        alt={stats.favCoinByTrades.symbol}
                        className="size-full object-cover"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent p-4 backdrop-blur-sm sm:p-6">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-purple-500/20 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                    Daily
                  </p>
                  <p className="mt-2 text-sm text-gray-400">Volume</p>
                  <p className="mt-1 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-2xl font-semibold text-transparent">
                    {formatNumber(stats.daily.volume)}
                  </p>
                  <p className="mt-1 text-gray-400">
                    {formatTradesCount(stats.daily.trades)} trades
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/20 via-pink-500/10 to-transparent p-4 backdrop-blur-sm sm:p-6">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-pink-500/20 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-wider text-pink-300">
                    Weekly
                  </p>
                  <p className="mt-2 text-sm text-gray-400">Volume</p>
                  <p className="mt-1 bg-gradient-to-r from-pink-200 to-blue-200 bg-clip-text text-2xl font-semibold text-transparent">
                    {formatNumber(stats.weekly.volume)}
                  </p>
                  <p className="mt-1 text-gray-400">
                    {formatTradesCount(stats.weekly.trades)} trades
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-4 backdrop-blur-sm sm:col-span-1 sm:p-6">
                <div className="absolute -right-4 -top-4 size-24 rounded-full bg-blue-500/20 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                    Monthly
                  </p>
                  <p className="mt-2 text-sm text-gray-400">Volume</p>
                  <p className="mt-1 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-2xl font-semibold text-transparent">
                    {formatNumber(stats.monthly.volume)}
                  </p>
                  <p className="mt-1 text-gray-400">
                    {formatTradesCount(stats.monthly.trades)} trades
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-6 flex items-center justify-between border-t border-gray-700/50 pt-5 sm:mt-8 sm:pt-6">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gray-800/50 p-2 backdrop-blur-sm sm:size-12">
                  <img
                    src="/original.webp"
                    alt="Bluera"
                    className="size-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-2xl font-bold text-transparent">
                    Bluera
                  </span>
                  <span className="text-gray-500">Aura Card</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);


